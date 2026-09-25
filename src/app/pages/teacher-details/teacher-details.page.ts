import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { SeoService } from '../../core/seo.service';
import { CanonicalService } from '../../core/canonical.service';

interface Teacher {
  id: number;
  name: string;
  subject: string;
  image: string;
  degree: string;
  experience: number;
  specialization: string;
  bio: string;
  email: string;
  phone: string;
  office: string;
  officeHours: string;
  color: string;
  socialLinks: {
    facebook?: string;
    whatsapp?: string;
    youtube?: string;
  };
  demoVideo?: {
    youtubeId?: string;
    duration?: string;
    level?: string;
    topic?: string;
    description?: string;
  };
  isComingSoon?: boolean;
}

@Component({
  selector: 'app-teacher-details',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './teacher-details.page.html',
  styleUrls: ['./teacher-details.page.css']
})
export class TeacherDetailsPageComponent implements OnInit {
  teacher: Teacher | null = null;
  teacherId: number = 0;
  isVideoLoaded = false;

  teachers: Teacher[] = [
    {
      id: 1,
      name: 'م/ أحمد فتح الله',
      subject: ' ',
      image: 'assets/teacher.jpg',
      degree: '  ',
      experience: 13,
      specialization: 'الرياضيات العامة والخاصة',
      bio: '',
      email: 'ahmed.fathallah@engineering.edu',
      phone: '+201554843745',
      office: 'مبنى الرياضيات - الطابق الثالث - مكتب 301',
      officeHours: 'الأحد - الخميس: 10:00 ص - 10:00 م',
      color: 'blue',
      socialLinks: {
        facebook: 'https://www.facebook.com/share/1D7WGR9Ccz/',
        whatsapp: 'https://api.whatsapp.com/send/?phone=201064746369&text&type=phone_number&app_absent=0',
        youtube: 'https://youtube.com/@mr-ahmed-fathallah?si=QVMnPGojPl1KKAkm'
      },
      demoVideo: {
        youtubeId: 'KSlSrJtky3Y',
        duration: '',
        level:'',
        topic: '',
        description: ''
      }
    },
    {
      id: 2,
      name: 'م/ أحمد أبو زيد',
      subject: '',
      image: 'assets/teacher1.jpg',
      degree: '',
      experience: 10,
      specialization: 'الميكانيكا',
      bio: '',
      email: 'ahmed.abouzeid@engineering.edu',
      phone: '+201151016262',
      office: 'مبنى الميكانيكا - الطابق الثاني - مكتب 205',
      officeHours: 'الأحد - الأربعاء: 10:00 ص - 10:00 م',
      color: 'green',
      socialLinks: {
        facebook: 'https://www.facebook.com/share/1EbNiiV1X2/',
        whatsapp: 'https://wa.me/201151016262',
        youtube: 'https://youtube.com/@ahmed_abozeed?si=mfu1-CgVSm1LsMUQ'
      },
      demoVideo: {
        youtubeId: '74MvjbCVob4',
        duration: '',
        level:'',
        topic: '',
        description: ''
      }
    },
    {
      id: 3,
      name: 'د/ سعد العميري',
      subject: '',
      image: 'assets/teacher4.jpg',
      degree: '',
      experience: 8,
      specialization: 'الكيمياء ',
      bio: '',
      email: 'saad.alomairi@engineering.edu',
      phone: '+201148068718',
      office: 'مبنى الكيمياء - الطابق الأول - مكتب 101',
      officeHours: 'السبت - الأربعاء: 10:00 ص - 10:00 م',
      color: 'orange',
      socialLinks: {
        facebook: 'https://www.facebook.com/share/1BBUji24Kc/',
        whatsapp: 'https://wa.me/201148068718',
        youtube: 'https://youtube.com/@saadalaamairy6005?si=euH312iqEJN4ehb4'
      },
      demoVideo: {
        youtubeId: 'NCezzQ1Nupo',
        duration: '',
        level:'',
        topic: '',
        description: ''
      }
    },
    {
      id: 4,
      name: 'م/ أحمد الشامي',
      subject: '',
      image: 'assets/teacher3.jpg',
      degree: 'ماجستير في الفيزياء',
      experience: 8,
      specialization: 'الفيزياء',
      bio: '',
      email: 'ahmed.alshami@engineering.edu',
      phone: '+201000278286',
      office: 'مبنى الفيزياء - الطابق الثاني - مكتب 202',
      officeHours: 'الأحد - الخميس: 10:00 ص - 10:00 م',
      color: 'purple',
      socialLinks: {
        facebook: 'https://www.facebook.com/share/1B4CMMLdP7/',
        whatsapp: 'https://wa.me/201000278286',
        youtube: 'https://youtube.com/@pi-in-physics?si=cwgjm8J4_Bdu-6cI'
      },
      demoVideo: {
        youtubeId: 'jPdkXXWy_D4?',
        duration: '',
        level:'',
        topic: '',
        description: ''
      }
    },
    {
      id: 5,
      name: 'د/ عمر أحمد عبد الفتاح',
      subject: ' ',
      image: 'assets/teacher2.png',
      degree: '',
      experience: 6,
      specialization: 'اللغة الإنجليزية',
      bio: '',
      email: '',
      phone: '+201020107762',
      office: '',
      officeHours: '',
      color: 'red',
      socialLinks: {
        facebook: 'https://www.facebook.com/profile.php?id=61563784603700&rdid=6uU0ecDTzK2l1m02&share_url=https%3A%2F%2Fwww.facebook.com%2Fshare%2F17HrGLn8RK%2F#',
        whatsapp: 'https://wa.me/201020107762',
        youtube: 'https://www.youtube.com/@dr_omar'
      },
      demoVideo: {
        youtubeId: 'J9n2T9-MgxM',
        duration: '',
        topic: '',
        description: ''
      }
    }
  ];

  constructor(
    private route: ActivatedRoute, 
    private router: Router, 
    private sanitizer: DomSanitizer,
    private seo: SeoService,
    private canonical: CanonicalService
  ) {}

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.teacherId = +params['id'];
      this.teacher = this.teachers.find(t => t.id === this.teacherId) || null;
      
      // Update page title when teacher is loaded
      if (this.teacher && typeof window !== 'undefined') {
        const siteUrl = (window as any)['NG_SITE_URL'] || 'https://www.appmo3adla.com';
        const title = `${this.teacher.name} - ${this.teacher.subject} - ابلكيشن معادلة كلية هندسة`;
        const description = `تعرف على الأستاذ ${this.teacher.name} مدرس ${this.teacher.subject} في معادلة كلية الهندسة`;
        const url = `${siteUrl}/teacher/${this.teacher.id}`;
        
        this.seo.setTitle(title);
        this.seo.setDescription(description);
        this.seo.setOgTags({ title, description, url });
        this.seo.setTwitterTags({ title, description });
        this.canonical.setCanonical(url);
      }
      
      if (!this.teacher) {
        this.router.navigate(['/engineers']);
      }
    });
  }

  goBack() {
    this.router.navigate(['/engineers']);
  }

  loadVideo(): void {
    this.isVideoLoaded = true;
  }

  getVideoThumbnail(): string {
    const id = this.teacher?.demoVideo?.youtubeId?.replace('?', '') || '';
    return `https://img.youtube.com/vi/${id}/maxresdefault.jpg`;
  }

  getVideoEmbedUrl(): SafeResourceUrl {
    if (!this.teacher?.demoVideo?.youtubeId) {
      return this.sanitizer.bypassSecurityTrustResourceUrl('');
    }
    const cleanId = this.teacher.demoVideo.youtubeId.replace('?', '');
    const url = `https://www.youtube.com/embed/${cleanId}?autoplay=1&rel=0`;
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }

}
