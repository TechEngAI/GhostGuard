# GhostGuard Pitch Slides

## Slide 1 — The Problem

**Title:** Nigeria is losing ₦200 billion a year to people who don't exist.

**Key message:** Ghost workers bleed payroll budgets and HR has no automated detection.

**Bullet points:**
- ICPC discovered 23,000+ ghost workers in one state audit.
- Ghost workers collect full salaries but never report to work.
- Proxy clocking — one person checks in for five.
- HR has no automated way to detect any of this.

**Data points:**
- NGN 200B+ annual loss estimate.
- 23,000+ ghost workers found by ICPC.

**Speaker note:** Open with the ICPC headline. Let the number land. Do not rush.

## Slide 2 — The User

**Title:** Who needs GhostGuard?

**Key message:** HR managers need fraud visibility before payroll approval.

**Primary user:** HR Manager at a mid-size Nigerian company.

**Pain:** Manually reviewing payroll for 200+ employees every month.

**Secondary user:** Admin/CEO who signs off on payroll without fraud visibility.

**Quote:** “I have to trust attendance reports and payroll numbers with no way to tell if the worker was really there.”

**Speaker note:** Connect with the HR pain and the admin decision risk.

## Slide 3 — The Solution

**Title:** GhostGuard — AI-powered payroll fraud detection, built on Squad.

**Key message:** Detect. Remove. Pay.

**Visual:** GPS → AI → Squad.

**Bullet points:**
- GPS attendance and device fingerprinting catch buddy-punching.
- ML scores workers and flags suspicious payroll rows.
- Squad disburses salary only after verification.

**Speaker note:** Frame it as a complete pipeline from attendance to payment.

## Slide 4 — Squad API Integration

**Title:** Squad is the trust infrastructure.

**Key message:** Remove Squad and the trust chain breaks.

**Bullet points:**
- Bank verification — Squad confirms worker identity before payroll.
- Wallet funding — Company deposits salary funds through Squad checkout.
- Payroll disbursement — Squad transfers salary directly to verified accounts.

**Speaker note:** Emphasize Squad as the payments backbone, not optional plumbing.

## Slide 5 — AI & Data Intelligence

**Title:** AI catches ghost workers before payroll is approved.

**Key message:** Isolation Forest powered by 10 fraud signals.

**Bullet points:**
- 10 signals across attendance, geography, finance, digital, and admin behavior.
- Trust Score: 0-100 per worker.
- Verdicts: VERIFIED / SUSPICIOUS / FLAGGED.

**Sample output:**
- Worker: Jane Doe
- Trust Score: 18
- Verdict: FLAGGED
- Reasons: low attendance, consistent proxy check-ins, impossible travel

**Speaker note:** Show the model as a decision support system, not a black box.

## Slide 6 — User Flow (screenshots)

**Title:** From invite to payslip.

**Key message:** A complete workflow for admin, worker, and HR.

**Screens:**
- Admin creates role → invite code generated.
- Worker signs up with code → Squad bank verify.
- Worker checks in → GPS confirms location.
- Admin generates payroll → ML flags ghost workers.
- HR reviews trust scores → excludes flagged workers.
- Squad disburses salary → payslip shows TX ID.

**Speaker note:** Walk judges through the operational flow.

## Slide 7 — Impact Potential

**Title:** GhostGuard can protect millions of payroll budgets.

**Key message:** Small adoption unlocks large revenue.

**Data points:**
- Nigeria: 200,000+ organisations with payroll exposure.
- 1% adoption at NGN 5,000/month = NGN 10M MRR.
- Public sector potential for ministry-wide rollout.

**Expansion:**
- Phase 2: medical license verification, academic credentials.
- ROI: catch one ghost worker at NGN 200,000/month and the product pays for itself.

**Speaker note:** Make the financial upside concrete.

## Slide 8 — Scalability & Business Model

**Title:** Built to scale across companies.

**Key message:** Multi-tenant SaaS with predictable pricing.

**Bullet points:**
- Starter: up to 50 workers — NGN 5,000/month.
- Growth: up to 200 workers — NGN 15,000/month.
- Enterprise: 200+ workers — NGN 30,000/month + custom.
- Infrastructure: Railway backend, Vercel frontend.
- ML learns on each company’s data over time.

**Speaker note:** Frame GhostGuard as a SaaS product with tiered pricing.

## Slide 9 — Research & Validation

**Title:** Problem and product validated.

**Key message:** Real data and user feedback back the solution.

**Bullet points:**
- ICPC 2023 ghost worker audit report.
- IPPIS payroll challenges in Nigerian public sector.
- 3 user interviews: HR officer, company admin, university admin.
- ML accuracy: 90%+ on synthetic test dataset.
- GPS geofencing and Squad integration tested end-to-end.

**Speaker note:** Stress both market and technical validation.

## Slide 10 — The Team

**Title:** GhostGuard — built in 24 hours.

**Key message:** A focused team delivering product, backend, and ML.

**Team:**
- GhostGuard AI Engineering Team — product, backend, and ML.
- Backend / Supabase integration.
- Frontend / Next.js UX.
- ML / anomaly detection.
- Squad payments / wallet orchestration.

**Closing line:** GhostGuard — built in 24 hours. Ready to protect Nigerian payrolls.

## Demo Notes

**5-minute demo sequence:**

1. Minute 1: Show the problem dashboard with ghost worker fraud signals already populated.
2. Minute 2: Admin generates payroll — ML flags 3 ghost workers live.
3. Minute 3: HR reviews trust scores, excludes flagged workers.
4. Minute 4: HR approves — Squad disburses — show live payment status updating.
5. Minute 5: Worker opens payslip — Squad TX ID visible — this is tamper-evident proof.

**Q&A prep:**
- Why Squad? Because it provides trusted payment rails and bank verification.
- How does the model avoid bias? Isolation Forest uses normalized behavioural signals and low contamination.
- What if attendance drifts? The geofence and accuracy buffer reduce false positives.
- How do you handle real payroll? The audit trail, wallet accounting, and receipt verification are all built in.
