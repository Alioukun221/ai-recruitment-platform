package com.ept.sn.cri.backend.rh.dto;

import com.ept.sn.cri.backend.enums.ContractType;
import com.ept.sn.cri.backend.enums.JobStatus;
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
public class JobOfferListDTO {

    private Long id;
    private String jobTitle;
    private JobType jobType;
    private ContractType contractType;
    private JobStatus jobStatus;
    private Date publicationDate;
    private Date deadline;
    private Integer applicationCount;
}