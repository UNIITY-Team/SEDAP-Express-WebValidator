// ICD samples that do not satisfy the rules chosen for this project (see CLAUDE.md, "Entscheidungen").
// Key: the sample verbatim. Value: field names that are expected to produce an error.
// These are reported back to the ICD maintainers; the samples stay unchanged as fixtures.
export const KNOWN_ICD_SAMPLE_ISSUES = {
  // §6.4: FreqAgility/PRFAgility/Function without leading zero; Comment "SA-8" is not BASE64
  'EMISSION;5E;0195238E15AD;66A3;R;;;100;;53.32;8.11;0;;;;20;8725000.0#8735000.0;20000;3;0;2;6;10233;;SA-8':
    ['FreqAgility', 'PRFAgility', 'Function', 'Comment'],
  // §6.4: codes without leading zero
  'EMISSION;5F;0195238E25AD;66A3;R;;;101;;54.86;9.32;0;52.12;9.8;50;233;25725.0;4000;1;5;2;0;;sngpesr--------':
    ['FreqAgility', 'PRFAgility', 'Function'],
  // §6.6: Type without leading zero
  'TEXT;78;0195238E25AD;324E;S;TRUE;;;1;NONE;"This is an alert!";1000': ['Type'],
  'TEXT;79;0195238E25CC;324E;C;TRUE;;;2;NONE;"This is a warning!"': ['Type'],
  'TEXT;7A;0195238E25EF;324E;R;;;;3;;"This is a notice!"': ['Type'],
  'TEXT;7B;0195238E285B;324E;U;;;ORKA;4;BASE64;IlRoaXMgaXMgYSBjaGF0IG1lc3NhZ2UhIg==': ['Type'],
  // §7 (REST GET sample): Type without leading zero
  'TEXT;56;0191C643A8AF;324E;S;;;E4F1;4;NONE;This is a chat message!': ['Type'],
  // §6.9: CmdState without leading zero
  'STATUS;15;0195238E25AD;75DA;U;;;4;2;MLG#20;;Accu1#50;;443D;1;MTAuMC4wLjEzMg==;;RnVsbHkgb3BlcmF0aW9uYWw=': ['CmdState'],
  'STATUS;16;0195238E25AD;129E;R;;;2;2;BMG#10;;;;ED32;3;;aHR0cDovLzEwLjAuMC4xL2ltYWdlLnBuZw==;T3V0IG9mIGZ1ZWwh': ['CmdState'],
};
