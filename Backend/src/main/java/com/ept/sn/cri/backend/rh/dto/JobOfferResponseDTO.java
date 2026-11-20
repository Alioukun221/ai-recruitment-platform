package com.ept.sn.cri.backend.rh.dto;

import com.ept.sn.cri.backend.enums.ContractType;
import com.ept.sn.cri.backend.enums.JobStatus;
import com.ept.sn.cri.backend.enums.JobType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Date;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class JobOfferResponseDTO {

    private Long id;
    private String jobTitle;
    private JobType jobType;
    private ContractType contractType;
    private JobStatus jobStatus;
    private String description;
    private String requiredSkills;
    private String requiredEducationLevel;
    private Integer minExperience;
    private Date publicationDate;
    private Date lastModifiedDate;
    private Date deadline;
    private Long createdById;
    private String createdByName;
    private Integer applicationCount;
}