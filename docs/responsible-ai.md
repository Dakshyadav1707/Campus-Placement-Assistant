# Responsible AI

Responsible AI is an important part of the Campus Placement Assistant because the system provides information that students may use when making placement-related decisions.

The project applies responsible AI principles through grounding, source control, transparency, privacy protection, uncertainty handling, and human oversight.

---

## 1. Grounded Responses

The agent uses the project's placement knowledge base as the primary source for placement-related questions.

The system retrieves relevant information before generating responses rather than relying only on the language model's pretrained knowledge.

This helps keep responses connected to the available project data.

---

## 2. Hallucination Prevention

The agent instructions explicitly prohibit inventing:

- Placement eligibility criteria
- Company policies
- CGPA requirements
- Backlog requirements
- Placement statistics
- CTC or package information
- Hiring numbers
- Deadlines
- University rules

When required information is not available in the knowledge base, the agent is instructed to state that the information is unavailable rather than guessing.

### Key principle

> The agent never treats missing information as permission to guess.

---

## 3. Source Separation

Different types of placement information are stored in different sources.

For example:

- Company Drive Demo documents are used for eligibility information.
- Historical Placement Data documents are used for historical statistics.
- Global placement documents provide common policies, FAQs, and data definitions.

The agent is instructed not to use historical selected-student data as a substitute for a company's current eligibility cutoff.

This reduces the risk of mixing different types of information.

---

## 4. Company and Year Separation

The agent instructions require the system to keep company information and academic years separate.

The system should not:

- Mix information between companies
- Apply one company's eligibility criteria to another company
- Substitute one academic year's data for another
- Present historical information as current eligibility requirements

This is particularly important when answering multi-company or historical placement queries.

---

## 5. Missing Information Handling

When a requested company, year, statistic, or eligibility requirement is not available in the knowledge base, the agent should explicitly identify the information as unavailable.

For example:

`Cannot verify — source not retrieved.`

The system does not intentionally fill missing information using unsupported assumptions.

---

## 6. Transparency About Synthetic Data

The project uses a synthetic placement dataset created for academic demonstration.

The dataset contains company drive information, historical placement information, FAQs, policies, and related placement documents.

The agent is instructed to disclose that the information is synthetic and should not be interpreted as official company or university placement data.

### Data Source Notice

> The information above is based on a synthetic dataset created for academic demonstration purposes and does not represent official company or university placement data.

---

## 7. Privacy

The application is designed to avoid requiring unnecessary personal information.

Student questions can contain academic information such as:

- Degree/program
- CGPA
- Backlog status
- Semester

The project does not require sensitive personal information to answer normal placement eligibility questions.

---

## 8. Human Oversight

The Campus Placement Assistant is an informational system and is not an official placement authority.

Students should verify important placement decisions with the official Placement Cell and applicable company communication.

The system is designed to assist students, not replace official institutional decisions.

---

## 9. Reliability Testing

The agent was tested using several categories of queries:

### Eligibility Testing

Tests included:

- Single-company eligibility
- Multiple-company eligibility
- Different CGPA values
- Different academic programs
- Backlog conditions

### Retrieval Testing

The system was tested for retrieval of:

- Company drive documents
- Historical placement documents
- Multiple company sources
- Specific academic years

### Hallucination Resistance

The agent was tested with companies that were not present in the knowledge base.

The expected behavior was to report that the information was unavailable instead of inventing company data.

### Historical Data Testing

Historical placement queries were tested using specific academic years.

The system was also tested to ensure that unavailable future-year information was not replaced with older data.

### Numerical Consistency

Numerical placement data was tested for consistency.

For example, when semester-level and program-level hiring counts were available, the agent was tested on whether it could reason over those values without producing contradictory totals.

---

## 10. Responsible AI Design Summary

| Principle | Implementation |
|---|---|
| Grounding | Knowledge-base retrieval |
| Hallucination prevention | Explicit no-invention instructions |
| Source integrity | Company and source-specific retrieval rules |
| Temporal accuracy | Academic-year separation |
| Transparency | Synthetic-data disclosure |
| Privacy | No unnecessary sensitive information |
| Human oversight | Placement Cell verification |
| Reliability | Eligibility, retrieval, historical and numerical tests |
| Uncertainty handling | Explicit unavailable/source-not-retrieved responses |

---

## 11. Limitations

The system has important limitations:

- The dataset is synthetic.
- The assistant cannot guarantee that information reflects current real-world placement drives.
- Information outside the knowledge base may be unavailable.
- Backend conversation mappings are stored in memory and are lost when the backend restarts.
- Official company and university sources should be used for final verification.

These limitations are communicated as part of the responsible use of the system.