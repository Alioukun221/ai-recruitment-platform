import {
  afterNextRender,
  ChangeDetectorRef,
  Component,
  HostListener,
  inject,
  NgZone,
  OnInit,
  PLATFORM_ID
} from '@angular/core';
import { ApplicationListDto } from '../../api/models/application-list-dto';
import { ActivatedRoute, Router } from '@angular/router';
import { Api } from '../../api/api';
import {getApplicationsByJobOffer, shortlistApplications, updateApplicationStatus} from '../../api/functions';
import { FormsModule } from '@angular/forms';
import { isPlatformBrowser, NgClass, NgForOf, NgIf } from '@angular/common';

@Component({
  selector: 'app-list-candidat-by-offer',
  imports: [
    FormsModule,
    NgClass,
    NgIf,
    NgForOf
  ],
  templateUrl: './list-candidat-by-offer-component.html',
  styleUrl: './list-candidat-by-offer-component.css',
})
export class ListCandidatByOfferComponent implements OnInit {
  private platformId = inject(PLATFORM_ID);
  applications: ApplicationListDto[] = [];
  filteredApplications: ApplicationListDto[] = [];
  isLoading: boolean = true;
  errorMessage: string | null = null;
  successMessage: string | null = null;
  selectedApplications: number[] = [];
  offerId: number | null = null;
  isShortlisting: boolean = false;
  showStatusDropdown: boolean = false;
  selectedNewStatus: string = '';
  statusComment: string = '';
  isUpdatingStatus: boolean = false;

  // Tri
  sortColumn: string = '';
  sortDirection: 'asc' | 'desc' = 'asc';

  // Filtres
  searchQuery: string = '';
  selectedStatus: string = '';
  selectedDegree: string = '';
  minScore: number | null = null;

  // Options pour les filtres
  statusOptions = [
    { value: '', label: 'Tous les statuts' },
    { value: 'DRAFT', label: 'Brouillon' },
    { value: 'SUBMITTED', label: 'Soumise' },
    { value: 'UNDER_REVIEW', label: 'En révision' },
    { value: 'AI_SCORED', label: 'Évaluée par IA' },
    { value: 'SHORTLISTED', label: 'Présélectionnée' },
    { value: 'INTERVIEW_SCHEDULED', label: 'Entretien prévu' },
    { value: 'INTERVIEW_COMPLETED', label: 'Entretien terminé' },
    { value: 'ACCEPTED', label: 'Acceptée' },
    { value: 'REJECTED', label: 'Rejetée' },
    { value: 'WITHDRAWN', label: 'Retirée' }
  ];
  statusChangeOptions = [
    { value: 'SUBMITTED', label: 'Soumise', icon: '📝' },
    { value: 'UNDER_REVIEW', label: 'En révision', icon: '🔍' },
    { value: 'AI_SCORED', label: 'Évaluée par IA', icon: '🤖' },
    { value: 'SHORTLISTED', label: 'Présélectionnée', icon: '⭐' },
    { value: 'INTERVIEW_SCHEDULED', label: 'Entretien prévu', icon: '📅' },
    { value: 'INTERVIEW_COMPLETED', label: 'Entretien terminé', icon: '✓' },
    { value: 'ACCEPTED', label: 'Acceptée', icon: '✅' },
    { value: 'REJECTED', label: 'Rejetée', icon: '❌' },
    { value: 'WITHDRAWN', label: 'Retirée', icon: '↩️' }
  ];

  degreeOptions = [
    { value: '', label: 'Tous les diplômes' },
    { value: 'BAC', label: 'Baccalauréat' },
    { value: 'LICENSE', label: 'Licence' },
    { value: 'MASTER', label: 'Master' },
    { value: 'DOCTORAT', label: 'Doctorat' }
  ];

  constructor(
    private api: Api,
    private cdr: ChangeDetectorRef,
    private router: Router,
    private route: ActivatedRoute,
    private ngZone: NgZone
  ) {}

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      // Récupérer l'ID de l'offre depuis l'URL
      this.route.params.subscribe(params => {
        this.offerId = +params['offerId'];
        if (this.offerId) {
          setTimeout(() => {
            this.loadApplications();
          }, 100);
        }
      });
    }
  }

  async loadApplications(status?: 'DRAFT' | 'SUBMITTED' | 'UNDER_REVIEW' | 'AI_SCORED' | 'SHORTLISTED' | 'INTERVIEW_SCHEDULED' | 'INTERVIEW_COMPLETED' | 'ACCEPTED' | 'REJECTED' | 'WITHDRAWN'): Promise<void> {
    if (!this.offerId) return;

    this.isLoading = true;
    this.errorMessage = null;

    try {
      const params: any = { jobOfferId: this.offerId };
      if (status) {
        params.status = status;
      }

      const response = await this.api.invoke(getApplicationsByJobOffer, params);

      this.applications = response || [];
      this.filteredApplications = [...this.applications];
      this.applyFilters();
      this.isLoading = false;
      console.log('✅ Candidatures chargées', this.applications);

      this.cdr.detectChanges();

    } catch (error) {
      console.error('❌ Erreur chargement candidatures', error);
      this.errorMessage = 'Impossible de charger les candidatures pour le moment.';
      this.isLoading = false;
      this.cdr.detectChanges();
    }
  }

  async bulkShortlist(): Promise<void> {
    if (this.selectedApplications.length === 0) {
      this.errorMessage = 'Veuillez sélectionner au moins une candidature à présélectionner.';
      this.clearErrorMessage();
      return;
    }

    if (!this.offerId) {
      this.errorMessage = 'ID de l\'offre d\'emploi introuvable.';
      return;
    }

    const confirmShortlist = confirm(
      `Êtes-vous sûr de vouloir présélectionner ${this.selectedApplications.length} candidature(s) ?\n\nCes candidatures passeront au statut "SHORTLISTED".`
    );

    if (!confirmShortlist) {
      return;
    }

    this.isShortlisting = true;
    this.errorMessage = null;
    this.successMessage = null;

    try {
      console.log('🔄 Présélection des candidatures:', this.selectedApplications);

      const params = {
        jobOfferId: this.offerId,
        body: {
          applicationIds: this.selectedApplications
        }
      };

      const response = await this.api.invoke(shortlistApplications, params);

      console.log('✅ Candidatures présélectionnées avec succès', response);

      this.successMessage = `${this.selectedApplications.length} candidature(s) présélectionnée(s) avec succès.`;

      // Réinitialiser la sélection
      this.selectedApplications = [];

      // Recharger la liste des candidatures
      await this.loadApplications();

      this.clearSuccessMessage();

    } catch (error: any) {
      console.error('❌ Erreur lors de la présélection', error);
      this.errorMessage = 'Une erreur est survenue lors de la présélection des candidatures.';

    } finally {
      this.isShortlisting = false;
      this.cdr.detectChanges();
    }
  }

  applyFilters(): void {
    this.filteredApplications = this.applications.filter(app => {
      const matchesSearch = !this.searchQuery ||
        (app.candidateName?.toLowerCase().includes(this.searchQuery.toLowerCase())) ||
        (app.candidateEmail?.toLowerCase().includes(this.searchQuery.toLowerCase())) ||
        (app.majorField?.toLowerCase().includes(this.searchQuery.toLowerCase()));

      const matchesStatus = !this.selectedStatus ||
        app.status === this.selectedStatus;

      const matchesDegree = !this.selectedDegree ||
        app.highestDegree === this.selectedDegree;

      const matchesScore = this.minScore === null ||
        (app.aiScore !== undefined && app.aiScore >= this.minScore);

      return matchesSearch && matchesStatus && matchesDegree && matchesScore;
    });
  }

  onSearchChange(): void {
    this.applyFilters();
  }

  onStatusFilterChange(): void {
    this.applyFilters();
  }

  onDegreeFilterChange(): void {
    this.applyFilters();
  }

  onScoreFilterChange(): void {
    this.applyFilters();
  }

  resetFilters(): void {
    this.searchQuery = '';
    this.selectedStatus = '';
    this.selectedDegree = '';
    this.minScore = null;
    this.applyFilters();
  }

  getStatusLabel(status?: string): string {
    const statusMap: { [key: string]: string } = {
      'DRAFT': 'Brouillon',
      'SUBMITTED': 'Soumise',
      'UNDER_REVIEW': 'En révision',
      'AI_SCORED': 'Évaluée par IA',
      'SHORTLISTED': 'Présélectionnée',
      'INTERVIEW_SCHEDULED': 'Entretien prévu',
      'INTERVIEW_COMPLETED': 'Entretien terminé',
      'ACCEPTED': 'Acceptée',
      'REJECTED': 'Rejetée',
      'WITHDRAWN': 'Retirée'
    };
    return status ? statusMap[status] || status : '';
  }

  getStatusClass(status?: string): string {
    const classMap: { [key: string]: string } = {
      'DRAFT': 'status-draft',
      'SUBMITTED': 'status-submitted',
      'UNDER_REVIEW': 'status-under-review',
      'AI_SCORED': 'status-ai-scored',
      'SHORTLISTED': 'status-shortlisted',
      'INTERVIEW_SCHEDULED': 'status-interview-scheduled',
      'INTERVIEW_COMPLETED': 'status-interview-completed',
      'ACCEPTED': 'status-accepted',
      'REJECTED': 'status-rejected',
      'WITHDRAWN': 'status-withdrawn'
    };
    return status ? classMap[status] || '' : '';
  }

  formatDate(date?: string): string {
    if (!date) return '-';
    const d = new Date(date);
    return d.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  getScoreColor(score?: number): string {
    if (!score) return '';
    if (score >= 80) return 'score-excellent';
    if (score >= 60) return 'score-good';
    if (score >= 40) return 'score-average';
    return 'score-low';
  }

  viewApplicationDetails(applicationId?: number): void {
    if (applicationId && this.offerId) {
      this.router.navigate(['/rh/job-offers', this.offerId, 'applications', applicationId]);
    }
  }

  downloadCV(cvUrl?: string): void {
    if (cvUrl) {
      window.open(cvUrl, '_blank');
    }
  }

  deleteApplication(application: ApplicationListDto): void {
    if (!application.id) return;

    const confirmDelete = confirm(
      `Êtes-vous sûr de vouloir supprimer la candidature de "${application.candidateName}" ?\n\nCette action est irréversible.`
    );

    if (confirmDelete) {
      console.log('Suppression de la candidature', application.id);
      // TODO: Implémenter l'appel au service de suppression
    }
  }

  toggleSelect(applicationId: number): void {
    const index = this.selectedApplications.indexOf(applicationId);
    if (index > -1) {
      this.selectedApplications.splice(index, 1);
    } else {
      this.selectedApplications.push(applicationId);
    }
  }

  toggleSelectAll(): void {
    if (this.isAllSelected()) {
      this.selectedApplications = [];
    } else {
      this.selectedApplications = this.filteredApplications
        .filter(app => app.id !== undefined)
        .map(app => app.id!);
    }
  }

  isSelected(applicationId?: number): boolean {
    if (!applicationId) return false;
    return this.selectedApplications.includes(applicationId);
  }

  isAllSelected(): boolean {
    return this.filteredApplications.length > 0 &&
      this.selectedApplications.length === this.filteredApplications.length;
  }

  isSomeSelected(): boolean {
    return this.selectedApplications.length > 0 &&
      this.selectedApplications.length < this.filteredApplications.length;
  }

  sortBy(column: string): void {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }

    this.filteredApplications.sort((a, b) => {
      let valueA: any = (a as any)[column];
      let valueB: any = (b as any)[column];

      if (valueA === undefined || valueA === null) return 1;
      if (valueB === undefined || valueB === null) return -1;

      if (column === 'submitDate') {
        valueA = new Date(valueA).getTime();
        valueB = new Date(valueB).getTime();
      }

      if (column === 'aiScore') {
        valueA = valueA || 0;
        valueB = valueB || 0;
      }

      if (typeof valueA === 'string') {
        valueA = valueA.toLowerCase();
        valueB = valueB.toLowerCase();
      }

      if (valueA < valueB) return this.sortDirection === 'asc' ? -1 : 1;
      if (valueA > valueB) return this.sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }

  // Fonction pour toggle le dropdown
  toggleStatusDropdown(): void {
    this.showStatusDropdown = !this.showStatusDropdown;
    if (!this.showStatusDropdown) {
      this.selectedNewStatus = '';
      this.statusComment = '';
    }
  }

// Fonction pour sélectionner un statut
  selectStatus(status: string): void {
    this.selectedNewStatus = status;
  }

// Fonction pour annuler le changement de statut
  cancelStatusChange(): void {
    this.showStatusDropdown = false;
    this.selectedNewStatus = '';
    this.statusComment = '';
  }

// Fonction modifiée pour changer le statut en masse
  async bulkChangeStatus(): Promise<void> {
    if (this.selectedApplications.length === 0) {
      this.errorMessage = 'Veuillez sélectionner au moins une candidature.';
      this.clearErrorMessage();
      return;
    }

    if (!this.selectedNewStatus) {
      this.errorMessage = 'Veuillez sélectionner un nouveau statut.';
      this.clearErrorMessage();
      return;
    }

    const confirmChange = confirm(
      `Êtes-vous sûr de vouloir changer le statut de ${this.selectedApplications.length} candidature(s) vers "${this.getStatusLabel(this.selectedNewStatus)}" ?`
    );

    if (!confirmChange) {
      return;
    }

    this.isUpdatingStatus = true;
    this.errorMessage = null;
    this.successMessage = null;

    try {
      console.log('🔄 Changement de statut des candidatures:', this.selectedApplications, 'vers', this.selectedNewStatus);

      // Mettre à jour chaque candidature sélectionnée
      const updatePromises = this.selectedApplications.map(applicationId => {
        const params = {
          applicationId: applicationId,
          body: {
            status: this.selectedNewStatus as any,
            comment: this.statusComment || undefined
          }
        };
        return this.api.invoke(updateApplicationStatus, params);
      });

      // Attendre que toutes les mises à jour soient terminées
      const results = await Promise.all(updatePromises);

      console.log('✅ Statuts mis à jour avec succès', results);

      this.successMessage = `Le statut de ${this.selectedApplications.length} candidature(s) a été changé vers "${this.getStatusLabel(this.selectedNewStatus)}" avec succès.`;

      // Réinitialiser
      this.selectedApplications = [];
      this.showStatusDropdown = false;
      this.selectedNewStatus = '';
      this.statusComment = '';

      // Recharger la liste
      await this.loadApplications();

      this.clearSuccessMessage();

    } catch (error: any) {
      console.error('❌ Erreur lors du changement de statut', error);
      this.errorMessage = 'Une erreur est survenue lors du changement de statut des candidatures.';

    } finally {
      this.isUpdatingStatus = false;
      this.cdr.detectChanges();
    }
  }
  @HostListener('document:click', ['$event'])
  onClickOutside(event: MouseEvent): void {
    const target = event.target as HTMLElement;

    // Vérifier si le clic est en dehors du dropdown
    if (!target.closest('.status-dropdown-container')) {
      this.showStatusDropdown = false;
    }
  }
  bulkDelete(): void {
    if (this.selectedApplications.length === 0) return;

    const confirmDelete = confirm(
      `⚠️ Êtes-vous sûr de vouloir supprimer ${this.selectedApplications.length} candidature(s) ?\n\nCette action est irréversible.`
    );

    if (confirmDelete) {
      console.log('Supprimer les candidatures:', this.selectedApplications);
      // TODO: Appeler l'API pour supprimer en masse
    }
  }

  getAcceptedCount(): number {
    return this.applications.filter(app => app.status === 'ACCEPTED').length;
  }

  hasActiveFilters(): boolean {
    return !!(this.searchQuery || this.selectedStatus || this.selectedDegree || this.minScore !== null);
  }

  clearSearch(): void {
    this.searchQuery = '';
    this.onSearchChange();
  }

  toggleStatusFilter(status: string): void {
    this.selectedStatus = this.selectedStatus === status ? '' : status;
    this.onStatusFilterChange();
  }

  getRelativeDate(date?: string): string {
    if (!date) return '';

    const now = new Date();
    const targetDate = new Date(date);
    const diffTime = now.getTime() - targetDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 1) {
      return 'Aujourd\'hui';
    } else if (diffDays === 1) {
      return 'Hier';
    } else if (diffDays < 7) {
      return `Il y a ${diffDays} jour(s)`;
    } else if (diffDays < 30) {
      return `Il y a ${Math.floor(diffDays / 7)} semaine(s)`;
    } else if (diffDays < 365) {
      return `Il y a ${Math.floor(diffDays / 30)} mois`;
    } else {
      return `Il y a ${Math.floor(diffDays / 365)} an(s)`;
    }
  }

  toggleView(): void {
    console.log('Changer de vue (optionnel)');
  }

  exportData(): void {
    console.log('Exporter les candidatures');

    const headers = ['Candidat', 'Email', 'Diplôme', 'Domaine', 'Score IA', 'Statut', 'Date de soumission'];
    const csvData = this.filteredApplications.map(app => [
      app.candidateName || '',
      app.candidateEmail || '',
      app.highestDegree || '',
      app.majorField || '',
      (app.aiScore || 0).toString(),
      this.getStatusLabel(app.status),
      this.formatDate(app.submitDate)
    ]);

    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `candidatures-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  clearSuccessMessage(): void {
    setTimeout(() => {
      this.successMessage = null;
      this.cdr.detectChanges();
    }, 5000);
  }

  clearErrorMessage(): void {
    setTimeout(() => {
      this.errorMessage = null;
      this.cdr.detectChanges();
    }, 5000);
  }

  backToJobOffers(): void {
    this.router.navigate(['/rh/job-offers']);
  }
}
