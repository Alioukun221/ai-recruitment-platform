package com.ept.sn.cri.backend.rh.service;


import com.ept.sn.cri.backend.entity.JobOffer;
import com.ept.sn.cri.backend.entity.RH;
import com.ept.sn.cri.backend.enums.JobStatus;
import com.ept.sn.cri.backend.exception.ResourceNotFoundException;
import com.ept.sn.cri.backend.exception.UnauthorizedActionException;
import com.ept.sn.cri.backend.rh.dto.CreateJobOfferDTO;
import com.ept.sn.cri.backend.rh.dto.JobOfferListDTO;
import com.ept.sn.cri.backend.rh.dto.JobOfferResponseDTO;
import com.ept.sn.cri.backend.rh.dto.UpdateJobOfferDTO;
import com.ept.sn.cri.backend.rh.repository.JobOfferRepository;
import com.ept.sn.cri.backend.rh.repository.RHRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class JobOfferService {

    private final JobOfferRepository jobOfferRepository;
    private final RHRepository rhRepository;

    /**
     * Créer une nouvelle offre d'emploi
     */
    @Transactional
    public JobOfferResponseDTO createJobOffer(CreateJobOfferDTO dto, Long rhId) {
        RH rh = rhRepository.findById(rhId)
                .orElseThrow(() -> new ResourceNotFoundException("RH non trouvé avec l'ID : " + rhId));

        JobOffer jobOffer = new JobOffer();
        jobOffer.setJobTitle(dto.getJobTitle());
        jobOffer.setJobType(dto.getJobType());
        jobOffer.setContractType(dto.getContractType());
        jobOffer.setDescription(dto.getDescription());
        jobOffer.setRequiredSkills(dto.getRequiredSkills());
        jobOffer.setRequiredEducationLevel(dto.getRequiredEducationLevel());
        jobOffer.setMinExperience(dto.getMinExperience());
        jobOffer.setDeadline(dto.getDeadline());
        jobOffer.setJobStatus(JobStatus.PUBLISHED);
        jobOffer.setCreatedBy(rh);

        JobOffer savedOffer = jobOfferRepository.save(jobOffer);
        return mapToResponseDTO(savedOffer);
    }

    /**
     * Modifier une offre d'emploi existante
     */
    @Transactional
    public JobOfferResponseDTO updateJobOffer(Long offerId, UpdateJobOfferDTO dto, Long rhId) {
        JobOffer jobOffer = jobOfferRepository.findByIdAndCreatedById(offerId, rhId)
                .orElseThrow(() -> new UnauthorizedActionException("Offre non trouvée ou vous n'avez pas les droits pour la modifier"));

        if (dto.getJobTitle() != null) {
            jobOffer.setJobTitle(dto.getJobTitle());
        }
        if (dto.getJobType() != null) {
            jobOffer.setJobType(dto.getJobType());
        }
        if (dto.getContractType() != null) {
            jobOffer.setContractType(dto.getContractType());
        }
        if (dto.getJobStatus() != null) {
            jobOffer.setJobStatus(dto.getJobStatus());
        }
        if (dto.getDescription() != null) {
            jobOffer.setDescription(dto.getDescription());
        }
        if (dto.getRequiredSkills() != null) {
            jobOffer.setRequiredSkills(dto.getRequiredSkills());
        }
        if (dto.getRequiredEducationLevel() != null) {
            jobOffer.setRequiredEducationLevel(dto.getRequiredEducationLevel());
        }
        if (dto.getMinExperience() != null) {
            jobOffer.setMinExperience(dto.getMinExperience());
        }
        if (dto.getDeadline() != null) {
            jobOffer.setDeadline(dto.getDeadline());
        }

        JobOffer updatedOffer = jobOfferRepository.save(jobOffer);
        return mapToResponseDTO(updatedOffer);
    }

    /**
     * Supprimer une offre d'emploi
     */
    @Transactional
    public void deleteJobOffer(Long offerId, Long rhId) {
        JobOffer jobOffer = jobOfferRepository.findByIdAndCreatedById(offerId, rhId)
                .orElseThrow(() -> new UnauthorizedActionException("Offre non trouvée ou vous n'avez pas les droits pour la supprimer"));

        jobOfferRepository.delete(jobOffer);
    }


    /**
     * Obtenir toutes les offres d'un RH, avec filtre optionnel par statut
     */
    @Transactional(readOnly = true)
    public List<JobOfferListDTO> getAllJobOffers(Long rhId, JobStatus status) {
        List<JobOffer> offers;

        if (status != null) {
            offers = jobOfferRepository.findByCreatedByIdAndJobStatusOrderByDatePublicationDesc(rhId, status);
        } else {
            offers = jobOfferRepository.findByCreatedByIdOrderByDatePublicationDesc(rhId);
        }

        return offers.stream()
                .map(this::mapToListDTO)
                .collect(Collectors.toList());
    }


    /**
     * Obtenir les détails d'une offre spécifique
     */
    @Transactional(readOnly = true)
    public JobOfferResponseDTO getJobOfferById(Long offerId, Long rhId) {
        JobOffer jobOffer = jobOfferRepository.findByIdAndCreatedById(offerId, rhId)
                .orElseThrow(() -> new RuntimeException("Offre non trouvée ou vous n'avez pas les droits pour y accéder"));

        return mapToResponseDTO(jobOffer);
    }


    // Méthodes de mapping privées
    private JobOfferResponseDTO mapToResponseDTO(JobOffer jobOffer) {
        return JobOfferResponseDTO.builder()
                .id(jobOffer.getId())
                .jobTitle(jobOffer.getJobTitle())
                .jobType(jobOffer.getJobType())
                .contractType(jobOffer.getContractType())
                .jobStatus(jobOffer.getJobStatus())
                .description(jobOffer.getDescription())
                .requiredSkills(jobOffer.getRequiredSkills())
                .requiredEducationLevel(jobOffer.getRequiredEducationLevel())
                .minExperience(jobOffer.getMinExperience())
                .publicationDate(jobOffer.getPublicationDate())
                .lastModifiedDate(jobOffer.getLastModifiedDate())
                .deadline(jobOffer.getDeadline())
                .createdById(jobOffer.getCreatedBy().getId())
                .createdByName(jobOffer.getCreatedBy().getFullName())
                .applicationCount(jobOffer.getApplications() != null ? jobOffer.getApplications().size() : 0)
                .build();
    }

    private JobOfferListDTO mapToListDTO(JobOffer jobOffer) {
        return JobOfferListDTO.builder()
                .id(jobOffer.getId())
                .jobTitle(jobOffer.getJobTitle())
                .jobType(jobOffer.getJobType())
                .contractType(jobOffer.getContractType())
                .jobStatus(jobOffer.getJobStatus())
                .publicationDate(jobOffer.getPublicationDate())
                .deadline(jobOffer.getDeadline())
                .applicationCount(jobOffer.getApplications() != null ? jobOffer.getApplications().size() : 0)
                .build();
    }

}
