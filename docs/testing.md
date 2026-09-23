# Testing and Reliability

The Campus Placement Assistant was tested across eligibility retrieval, multi-company retrieval, hallucination resistance, historical data handling, future-year handling, source separation, and numerical consistency.

The testing focused on whether the agent retrieves information from the correct sources and avoids unsupported assumptions.

---

## 1. Eligibility Retrieval Test

### Test

Student profile:

- Program: CSE (AI & ML)
- CGPA: 8.42
- Active backlogs: None

The agent was asked to determine eligibility across the available company drive documents.

### Expected behavior

The agent should:

- Use company Drive Demo documents for eligibility.
- Check the student's program.
- Check the CGPA requirement.
- Check active backlog requirements.
- Clearly distinguish eligible and ineligible companies.
- Avoid inventing missing requirements.

### Result

The test was used to validate multi-company eligibility retrieval and source grounding.

---

## 2. Specific Company Retrieval Test

The agent was tested with individual company eligibility queries.

Examples included:

- TCS
- IBM
- Amazon
- NVIDIA
- Microsoft

The system correctly retrieved company-specific eligibility information from the corresponding Drive Demo sources.

Example verified values included:

| Company | Minimum CGPA |
|---|---:|
| NVIDIA | 8.00 |
| TCS | 6.00 |
| Microsoft | 8.00 |
| IBM | 6.50 |
| Amazon | 7.50 |

The tests also checked program eligibility, active backlog requirements, and applicable semester information.

---

## 3. Hallucination Resistance Test

### Test

The agent was asked about a company that was not present in the project's knowledge base.

### Expected behavior

The agent should not invent:

- Eligibility criteria
- CGPA requirements
- Placement statistics
- Company-specific policies

### Result

The agent correctly reported that the requested information was unavailable and directed the user toward official placement verification.

This test validated the system's missing-information and hallucination-prevention behavior.

---

## 4. Eligibility Logic Test

### Test

The agent was given a lower CGPA and asked about multiple companies.

The test was designed to check whether the agent would incorrectly use historical placement data as current eligibility criteria.

### Expected behavior

The agent should use:

`Company Drive Demo → Eligibility`

and should not use:

`Historical Placement Data → Eligibility cutoff`

### Result

This test identified source-mixing issues during development.

The agent instructions were subsequently strengthened to enforce strict source priority and prohibit deriving eligibility cutoffs from historical selected-student data.

---

## 5. Historical Placement Test

The agent was tested with historical placement questions for specific academic years.

The test checked whether the system could retrieve historical information without mixing companies or academic years.

### Expected behavior

The agent should:

- Use historical placement documents.
- Preserve the requested academic year.
- Keep company information separate.
- Avoid substituting data from another year.

---

## 6. Future-Year Availability Test

### Test

The agent was asked for NVIDIA placement information for:

`2026–27`

### Expected behavior

If the requested year is not present in the knowledge base, the agent should state that the information is unavailable.

It should not replace the requested year with:

`2025–26`

### Result

The agent correctly identified the requested future-year information as unavailable and did not substitute the previous academic year's data.

---

## 7. Numerical Consistency Test

### Test

The agent was tested using NVIDIA 2025–26 placement data.

The available values included:

- Total hires: 26
- Semester 6: 6
- Semester 7: 15
- Semester 8: 5

The semester totals were checked:

`6 + 15 + 5 = 26`

Program-level values were also available:

- CSE: 8
- CSE AI & ML: 12
- CSE AI & FT: 6

These were checked:

`8 + 12 + 6 = 26`

### Result

The totals were internally consistent.

This test was used to verify that the agent could reason over retrieved numerical information without producing contradictory totals.

---

## 8. Multi-Company Retrieval Stress Test

A large test was performed using all 20 companies and historical placement information across multiple academic years.

The test specifically checked:

- Whether all requested companies were included.
- Whether companies were duplicated.
- Whether any company was omitted.
- Whether company information was mixed.
- Whether unavailable sources were explicitly identified.

### Result

The agent instructions were strengthened during development to require:

- Every requested company exactly once.
- No grouping or duplicate companies.
- No omission of companies.
- Explicit unavailable/source-not-retrieved status when required.

The final production test successfully returned all 20 companies exactly once and explicitly identified unavailable information where applicable.

---

## 9. Current vs Baseline Retrieval Test

A baseline version of the agent instructions was compared with the production version.

The comparison used individual and small multi-company retrieval tests.

### Result

For single-company retrieval, both versions returned the same correct TCS Drive Demo information.

A five-company retrieval test also produced consistent company-specific eligibility information for:

- NVIDIA
- TCS
- Microsoft
- IBM
- Amazon

The production version was retained because it included the additional source-control, missing-data, multi-company, and Responsible AI requirements.

---

## 10. Frontend and Backend Testing

The complete application was tested through the working frontend.

### Frontend

The React + Vite frontend was tested for:

- Backend connection
- Sending user messages
- Receiving agent responses
- Displaying responses
- Loading state
- Error handling
- Clearing the conversation

### Backend

The FastAPI backend was tested for:

- Health check
- `/chat` endpoint
- Request validation
- Session handling
- Foundry communication
- Error handling

The backend returns a generic error to the browser while keeping the detailed exception server-side.

---

## 11. Testing Summary

| Test Area | Purpose | Result |
|---|---|---|
| Eligibility retrieval | Verify company-specific eligibility | Passed |
| Company retrieval | Verify source-specific retrieval | Passed |
| Hallucination resistance | Prevent unsupported information | Passed |
| Eligibility logic | Prevent historical/current source mixing | Improved and validated |
| Historical data | Preserve company/year separation | Passed |
| Future-year handling | Prevent year substitution | Passed |
| Numerical consistency | Verify retrieved totals | Passed |
| 20-company stress test | Test exhaustive retrieval | Passed |
| Baseline comparison | Compare retrieval behavior | Passed |
| Frontend/backend | Validate end-to-end application | Passed |

---

## 12. Testing Philosophy

Testing was not limited to checking whether the agent could produce an answer.

The project also tested whether the agent could:

- Refuse to invent missing information.
- Use the correct source for the requested information.
- Preserve academic-year context.
- Keep company information separate.
- Handle multiple companies without omissions.
- Maintain numerical consistency.
- Communicate uncertainty clearly.

This makes reliability and Responsible AI part of the system design rather than an afterthought.