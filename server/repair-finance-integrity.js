const crypto = require('crypto');
const path = require('path');
const Database = require('better-sqlite3');

const databaseFile = process.env.SQLITE_FILE || path.join(__dirname, 'data', 'app.db');
const db = new Database(databaseFile);

function expectedPayrollAmount(employee, month) {
	const record = (employee.monthlyRecords || []).find(item => item.month === month);
	const base = record?.salary === null || record?.salary === undefined || record?.salary === '' ? Number(employee.baseSalary || 0) : Number(record.salary || 0);
	const adjustments = Array.isArray(record?.adjustments) ? record.adjustments : [];
	const bonus = adjustments.filter(item => item.kind === 'bonus').reduce((sum, item) => sum + Number(item.amount || 0), 0);
	const discount = adjustments.filter(item => item.kind === 'discount').reduce((sum, item) => sum + Number(item.amount || 0), 0);
	return Math.max(0, base + bonus - discount);
}

const repair = db.transaction(() => {
	const page = db.prepare('SELECT data FROM pages WHERE key = ?').get('employees');
	const employees = page ? JSON.parse(page.data).items || [] : [];
	const payments = db.prepare('SELECT * FROM finance_payroll_payments WHERE status = ?').all('paid');
	const updatePayment = db.prepare('UPDATE finance_payroll_payments SET amount = ?, updated_at = ? WHERE id = ?');
	const updateTransaction = db.prepare('UPDATE finance_transactions SET amount = ?, updated_at = ? WHERE id = ?');
	const insertAudit = db.prepare('INSERT INTO finance_audit_logs(id,entity_type,entity_id,action,before_data,after_data,reason,actor,created_at) VALUES (?,?,?,?,?,?,?,?,?)');
	const repaired = [];
	for (const payment of payments) {
		const employee = employees.find(item => Number(item.id) === Number(payment.employee_id));
		if (!employee) continue;
		const expected = expectedPayrollAmount(employee, payment.month);
		if (Math.abs(Number(payment.amount) - expected) < 0.005) continue;
		const transaction = payment.transaction_id ? db.prepare('SELECT * FROM finance_transactions WHERE id = ?').get(payment.transaction_id) : null;
		if (!transaction || transaction.status !== 'posted') throw new Error(`Cannot reconcile payroll payment ${payment.id}: linked transaction is missing or not posted.`);
		const now = new Date().toISOString();
		updatePayment.run(expected, now, payment.id);
		updateTransaction.run(expected, now, transaction.id);
		const afterPayment = { ...payment, amount: expected, updated_at: now };
		const afterTransaction = { ...transaction, amount: expected, updated_at: now };
		insertAudit.run(crypto.randomUUID(), 'payroll_payment', payment.id, 'reconciled', JSON.stringify(payment), JSON.stringify(afterPayment), 'تصحيح مبلغ الراتب ليتطابق مع صافي كشف الرواتب', 'system', now);
		insertAudit.run(crypto.randomUUID(), 'finance_transaction', transaction.id, 'reconciled', JSON.stringify(transaction), JSON.stringify(afterTransaction), 'تصحيح مبلغ حركة الراتب ليتطابق مع صافي كشف الرواتب', 'system', now);
		repaired.push({ employeeId: payment.employee_id, month: payment.month, previousAmount: Number(payment.amount), correctedAmount: expected });
	}
	return repaired;
});

try {
	console.log(JSON.stringify({ repaired: repair() }, null, 2));
} finally {
	db.close();
}
