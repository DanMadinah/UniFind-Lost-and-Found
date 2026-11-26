# Security Policy

## Security Architecture

UniFind is designed with the following safeguards when deployed with Firebase Authentication and Realtime Database:

1. **Backend Role Enforcement:** User roles (`STUDENT` and `SECURITY`) are stored under `/unifind/roles/<uid>` with `.write: false` so clients cannot elevate their own permissions.
2. **Contact Privacy:** Reporter email addresses and matric numbers are hidden on public item cards and are only visible to Campus Security or after an ownership claim is approved.
3. **Claim Verification & Handover Codes:** Found items require an ownership verification question and a one-time 6-character pickup code (`UF-XXXX`) before being marked Returned.
4. **Input & Export Safety:** Photo uploads are validated for image MIME type and size (max 2 MB) before compression, and CSV exports escape spreadsheet formula characters (`=`, `+`, `-`, `@`).

## Reporting a Vulnerability

If you discover a security issue in this repository, please open a private report or contact the maintainer through GitHub (`@DanMadinah`) rather than posting sensitive exploit details publicly.
