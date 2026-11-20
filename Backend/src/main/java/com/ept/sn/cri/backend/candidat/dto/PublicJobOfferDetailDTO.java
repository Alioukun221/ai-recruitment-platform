package com.ept.sn.cri.backend.candidat.dto;

import com.ept.sn.cri.backend.enums.ContractType;
import com.ept.sn.cri.backend.enums.JobType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.Date;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PublicJobOfferDetailDTO {

    private Long id;
    private String jobTitle;
    private JobType jobType;
    private ContractType contractType;
    private String description;
    private String requiredSkills;
    private String requiredEducationLevel;
    private Integer minExperience;
    private Date publicationDate;
    private Date deadline;
    private Integer applicationCount;
    private String companyName; // a changer apres
}