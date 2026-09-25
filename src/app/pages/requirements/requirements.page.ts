import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { subPageTransition, fadeInUp, staggerList, cascadeAnimation } from '../../shared/animations';
import { SeoService } from '../../core/seo.service';
import { CanonicalService } from '../../core/canonical.service';
import { MonthlyContentService } from '../../core/services/monthly-content.service';
import { cmsPageDefaults } from '../../core/cms-page.registry';

@Component({
  selector: 'app-requirements-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './requirements.page.html',
  styleUrls: ['./requirements.page.css'],
    animations: [subPageTransition, fadeInUp, staggerList, cascadeAnimation]
})
export class RequirementsPageComponent implements OnInit {
  selectedProgram: 'engineering' | 'computers' = 'engineering';
  isPageVisible = true;
  pageTitle = 'كل شروط المعادلة في مكان واحد';
  pageDescription = 'راجع الشروط والمستندات وخطوات التقديم قبل ما تبدأ، وخليك جاهز لكل مرحلة في طريقك لكلية الهندسة.';
  engineeringConditions: string[] = [];
  computersConditions: string[] = [];
  documents: string[] = [];
  steps: Array<{ title: string; description: string }> = [];

  constructor(
    private seo: SeoService,
    private canonical: CanonicalService,
    private contentService: MonthlyContentService
  ) {}

  selectProgram(program: 'engineering' | 'computers'): void {
    this.selectedProgram = program;
  }

  ngOnInit(): void {
    if (typeof window !== 'undefined') {
      const siteUrl = (window as any)['NG_SITE_URL'] || 'https://www.appmo3adla.com';
      const title = 'شروط التقديم - ابلكيشن معادلة كلية هندسة';
      const description = 'تعرف على شروط التقديم لمعادلة كلية الهندسة والمتطلبات اللازمة للدخول لكلية الهندسة';
      const url = `${siteUrl}/requirements`;
      
      this.seo.setTitle(title);
      this.seo.setDescription(description);
      this.seo.setOgTags({ title, description, url });
      this.seo.setTwitterTags({ title, description });
      this.canonical.setCanonical(url);
    }
	this.contentService.loadPageState('requirements', cmsPageDefaults.requirements).subscribe((content: any) => {
		this.isPageVisible = content?.visible !== false;
		this.pageTitle = content?.title || this.pageTitle;
		this.pageDescription = content?.description || this.pageDescription;
		this.engineeringConditions = content?.engineeringConditions || [];
		this.computersConditions = content?.computersConditions || [];
		this.documents = content?.documents || [];
		this.steps = content?.steps || [];
	});
  }

}
