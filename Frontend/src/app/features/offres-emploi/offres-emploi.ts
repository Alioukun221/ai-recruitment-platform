import {ChangeDetectorRef, Component, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ContentHeader} from '../../shared/content-header/content-header';
import {ApiWrapperService} from '../../services/api-wrapper';
import { ActivatedRoute, Router } from '@angular/router';
import {PublicJobOfferListDto} from '../../api/models/public-job-offer-list-dto';
import {getAvailableJobOffers} from '../../api/functions';
import {Api} from '../../api/api';

interface JobOffer {
  id: number;
  jobType: string;
  jobTitle: string;
  description: string;
  skills: string[];
  deadline: string;
  publicationDate: string;
  rating: number;
  minExperience: string;
  requiredEducationLevel: string;
  reviews: number;
  projects: number;
  totalSpent: string;
}

@Component({
  selector: 'app-offres-emploi',
  standalone: true,
  imports: [CommonModule, ContentHeader],
  templateUrl: './offres-emploi.html',
  styleUrls: ['./offres-emploi.css']
})
export class OffresEmploi implements OnInit {
  jobOffers: JobOffer[] = [];
  isLoading = false;
  error: string | null = null;

  constructor(private api: Api, private cdr: ChangeDetectorRef,private route: ActivatedRoute, private router: Router) {}

  ngOnInit() {
    this.loadJobOffers();
  }

  loadJobOffers() {
    this.isLoading = true;
    this.error = null;

    this.api.invoke(getAvailableJobOffers)
      .then(response => {
        console.log('Offres reçues :', response);

        this.jobOffers = this.mapToJobOffers(response);
        this.cdr.detectChanges();
        console.log('Offres mappee :', this.jobOffers);
      })
      .catch(error => {
        console.error('Erreur:', error);
        this.error = "Impossible de charger les offres d'emploi";
      })
      .finally(() => {
        this.isLoading = false;
      });

  }

  private mapToJobOffers(apiOffers: PublicJobOfferListDto[]): JobOffer[] {
    return apiOffers.map(offer => ({
      id: offer.id || 0,
      jobType: this.getCompanyFromJobType(offer.jobType),
      jobTitle: offer.jobTitle || 'Poste non spécifié',
      description: offer.description || '',
      skills: this.extractSkills(offer),
      requiredEducationLevel: this.formatNiveauEtude(offer.requiredEducationLevel),
      minExperience: this.formatExperience(offer.minExperience),
      rating: 0,
      deadline: this.formatDate(offer.deadline),
      publicationDate: this.formatDate(offer.publicationDate),
      reviews: offer.applicationCount || 0,
      projects: 0,
      totalSpent: this.formatContractType(offer.contractType)
    }));
  }

  private formatNiveauEtude(niveau: string | undefined): string {
    if (!niveau) {
      return 'Non spécifié';
    }
    return niveau.trim() || 'Non spécifié';
  }

  private formatExperience(experience: number | undefined): string {
    if (experience === undefined || experience === null) {
      return 'Non spécifiée';
    }

    if (experience === 0) {
      return 'Débutant accepté';
    }

    if (experience === 1) {
      return '1 an d\'expérience';
    }

    return `${experience} ans d\'expérience`;
  }

  private formatDate(dateString: string | undefined): string {
    if (!dateString) {
      return 'Non spécifiée';
    }

    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return 'Date invalide';
      }

      return date.toLocaleDateString('fr-FR');
    } catch (error) {
      console.error('Erreur de formatage de date:', error);
      return 'Date invalide';
    }
  }

  private getCompanyFromJobType(jobType?: 'PER' | 'PATS' | 'CONTRACTUEL'): string {
    const mapping = {
      'PER': 'Personnel Enseignant-Recherche',
      'PATS': 'Personnel Administratif',
      'CONTRACTUEL': 'Contractuel'
    };
    return jobType ? mapping[jobType] : 'Non spécifié';
  }

  private extractSkills(offer: PublicJobOfferListDto): string[] {
    const skills: string[] = [];

    if (offer.requiredEducationLevel) {
      skills.push(offer.requiredEducationLevel);
    }

    if (offer.minExperience !== undefined && offer.minExperience > 0) {
      skills.push(`${offer.minExperience} ans d'exp`);
    }

    if (offer.contractType) {
      skills.push(offer.contractType);
    }

    return skills.length > 0 ? skills : ['Aucune compétence spécifiée'];
  }

  private formatContractType(contractType?: 'CDD' | 'CDI' | 'STAGE'): string {
    const mapping = {
      'CDD': 'Contrat à Durée Déterminée',
      'CDI': 'Contrat à Durée Indéterminée',
      'STAGE': 'Stage'
    };
    return contractType ? mapping[contractType] : 'Non spécifié';
  }

  goToCandidater(id: number) {
    // const id = this.route.snapshot.params['id'];
    this.router.navigate([`/offres-emploi/${id}/apply`]);
  }
}
