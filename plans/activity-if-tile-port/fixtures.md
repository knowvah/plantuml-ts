# Affected fixtures — `activity-if-tile-port`

Rewritten by T1 from a scratch classifier (`../aitp-t1-scratch/scratch-classify-if.ts`,
throwaway, removed with the scratch worktree) that ports `ifBuilderOf` (T1's
note, `.agent-notes/aitp-T1.md` §Q0) onto the REAL parsed AST of every
`status: "baseline"` fixture in `oracle/goldens/svg-activity/diff-baseline.json`
— not a markup regex. `builders` lists every `if` node found by a pre-order
walk of the fixture's AST (nested ifs included), in source order, joined by
`+`; `(swap)` marks a `down` if whose main flow is the ORIGINAL else-branch,
`(opt)` marks one with a genuine `optionalStop` side box. The old `mixed`
placeholder is gone — every row's builder column comes from the dispatch
predicate.

**126 fixtures contain >=1 `if`** (not the provisional 123): the ported
predicate is case-insensitive and AST-based, so it catches 3 fixtures the
old regex missed on `IF(...)THEN`/`If (...)` casing —
`besaga-58-poli497`, `lopone-15-xiki477`, `tobajo-64-mipi810`.
Total pin sum over these 126 rows: **35535** (was 33909 over the provisional
123 — the 3 newly-found fixtures plus corrected builder columns account for
the difference; this sum is a fixtures.md bookkeeping total, not a probe
`subsetSum`, and is never gated).

**Out of scope (D8) — excluded from Q1 candidates, not from this table.**
Four fixtures set a non-default `ConditionStyle`/`ConditionEndStyle`
skinparam (D8's "2+2 of the 123"): `carapo-31-bisi880` (`ConditionStyle
InsideDiamond`), `xefalo-73-sabi101` (`ConditionStyle diamond` ==
`EMPTY_DIAMOND`), `pezubu-98-niba240` and `saxeku-17-gume203`
(`ConditionEndStyle hline`). Their builder classification is still correct
(the predicate doesn't depend on style), but T3–T5 must not pick them as
element-template representatives, and any residual on them is filed by T7
with the D8 cite, not chased.

**Q1 representative slugs** (verified against the predicate above, not the
mission brief's provisional list — see `.agent-notes/aitp-T1.md` §Q1 for why
the brief's `with-links` candidates were wrong on both counts: builder AND
D8 scope):
- `down`: `rerovo-62-nazo755` (106, plain), `vimako-25-mega336` (116, swap),
  `vaxiki-78-nice114` (128, swap+opt)
- `with-links`: `suzuci-53-biku826` (129), `feceme-58-xodo415` (133),
  `copisa-69-xisi273` (154)
- `long-horizontal`: `lifeve-53-zubi598` (123), `pekefu-66-mepa144` (159),
  `sofoje-37-tila554` (174) — these three matched the brief's own guesses.

| slug | builders | pin | laned |
|---|---|---|---|
| `bareka-88-fusu160` | down | 242 | - |
| `bazize-75-dedo568` | long+down | 354 | - |
| `bazuma-86-metu353` | links | 163 | - |
| `becaje-01-vaji284` | down(swap,opt) | 160 | - |
| `bedezo-44-more709` | links | 189 | - |
| `bepuku-07-vebe062` | long | 343 | - |
| `besaga-58-poli497` | long+links | 326 | - |
| `bideta-97-cezo697` | down(swap) | 178 | yes |
| `bidosa-98-veca008` | links | 176 | - |
| `biredi-08-bama025` | links+long | 314 | - |
| `bizono-61-sasa740` | down+down | 247 | - |
| `bocaga-53-nale241` | down(swap,opt) | 118 | - |
| `bolizi-92-pele824` | links | 300 | - |
| `boxoto-53-sifo232` | long+down+links+links+down+links | 1033 | - |
| `bozuro-33-celo170` | links | 198 | - |
| `cagoze-40-tete366` | down | 137 | - |
| `calenu-74-vigo098` | links+links | 305 | - |
| `carapo-31-bisi880` | down | 106 | - |
| `cemipu-87-dinu624` | down | 239 | yes |
| `ciceto-21-zanu057` | links+links | 247 | - |
| `cixave-47-milo698` | down | 245 | - |
| `copisa-69-xisi273` | links | 154 | - |
| `cujoni-21-somi079` | down | 211 | - |
| `dacuga-41-popo038` | down | 215 | - |
| `daxare-39-buci637` | links | 198 | - |
| `decudi-92-bisu741` | links | 366 | yes |
| `dixiku-28-guzo497` | down | 192 | - |
| `dotuzi-75-nape254` | links | 243 | - |
| `dozaxu-98-xetu961` | down(swap,opt) | 210 | - |
| `doziki-93-rosi997` | down+down | 307 | - |
| `dulezi-77-sana210` | links | 184 | - |
| `fatuzu-07-cevu894` | long | 270 | - |
| `feceme-58-xodo415` | links | 133 | - |
| `fetizo-39-jace641` | long | 235 | - |
| `fibafo-22-foze119` | down+down+down+down+down+down+links | 501 | - |
| `fivama-51-cusa142` | links+links | 175 | - |
| `fonabu-93-xama593` | down | 133 | - |
| `gacaja-15-keko600` | links+links+links | 443 | - |
| `gakelo-29-neno787` | down+links | 243 | - |
| `ganaku-47-muko252` | links | 223 | - |
| `gelono-70-zuce760` | down(swap,opt) | 219 | - |
| `gevaxi-80-tone223` | links | 220 | - |
| `gitoke-38-beme495` | long | 639 | - |
| `jafuli-91-sota277` | long | 301 | - |
| `jagove-43-nako107` | down+down+down | 360 | - |
| `javedu-70-vaxo310` | links | 164 | - |
| `jecoxu-17-zama003` | down(opt) | 136 | - |
| `jevoce-05-mumi686` | links | 375 | yes |
| `jipapo-14-kevu587` | down | 178 | - |
| `jisema-42-rapa121` | down | 160 | - |
| `jucidi-98-zato093` | long | 219 | yes |
| `judatu-15-xize591` | down+links | 577 | yes |
| `jupivo-67-gidi531` | down+down | 314 | - |
| `jupoxe-15-sugo110` | long+links+down(swap,opt)+down | 1974 | - |
| `kafevi-44-tesu096` | down(swap,opt) | 205 | - |
| `kepavi-26-sasu141` | links | 175 | - |
| `kitupi-32-jexo155` | links | 172 | - |
| `lacuci-13-nogo718` | down | 151 | - |
| `lafilo-69-tuti771` | down | 175 | - |
| `leduvi-16-voli986` | long | 356 | - |
| `letuke-04-poza319` | down | 227 | - |
| `levuma-67-cego489` | long | 244 | - |
| `lifeve-53-zubi598` | long | 123 | - |
| `livigo-47-negi605` | down | 145 | - |
| `lopone-15-xiki477` | long+links | 358 | - |
| `loxija-71-joku558` | links | 237 | - |
| `lufamo-62-xavo766` | long+long | 314 | - |
| `lukoxa-16-cecu095` | down(swap,opt) | 128 | yes |
| `mabuke-20-muco282` | long+links | 331 | - |
| `maduja-30-xiri319` | down+links | 308 | yes |
| `maketa-43-juja264` | links | 276 | yes |
| `manata-12-rido730` | down(swap,opt) | 257 | yes |
| `movexa-27-rexe388` | down(swap) | 178 | yes |
| `nafaxo-62-boso912` | links | 299 | - |
| `navene-45-cozo466` | down+down+down(swap) | 582 | yes |
| `nijipa-25-pede639` | down | 127 | - |
| `nikinu-06-sace939` | down | 237 | yes |
| `nimusa-16-tiku252` | down | 189 | - |
| `nojije-35-teta491` | long | 250 | yes |
| `nonusu-50-nute147` | down(opt)+down(swap,opt)+links | 266 | - |
| `nupose-71-vido428` | links | 365 | yes |
| `nusajo-97-bemo713` | down | 145 | - |
| `pedoco-30-mose082` | down | 185 | - |
| `pekefu-66-mepa144` | long | 159 | - |
| `pezubu-98-niba240` | links | 192 | yes |
| `pifoni-76-duxa505` | links | 255 | - |
| `pirofe-41-xama594` | links | 210 | - |
| `pixako-75-kumi821` | down+down(swap,opt) | 231 | - |
| `pokoro-73-bili712` | links+links | 322 | - |
| `pujozo-36-nino158` | down | 167 | yes |
| `raruzu-62-giro837` | down | 237 | yes |
| `relufo-04-fezo835` | links | 179 | - |
| `rerovo-62-nazo755` | down | 106 | - |
| `roboja-69-susa752` | links | 365 | yes |
| `rosizo-69-mera514` | down | 242 | - |
| `rujuxa-07-neco067` | links+links+links | 484 | yes |
| `ruzica-16-deli877` | links+down(swap,opt) | 514 | yes |
| `samavi-13-fuku339` | links | 174 | yes |
| `saxeku-17-gume203` | links | 151 | - |
| `secepo-00-febi326` | links+down | 284 | - |
| `sigofi-46-gaja158` | down | 199 | - |
| `sofoje-37-tila554` | long | 174 | - |
| `sokafe-69-jita472` | links+links | 247 | - |
| `sokapa-71-tifi543` | links | 262 | - |
| `sucice-41-pebi088` | down | 236 | yes |
| `sutura-08-zeme419` | down(opt)+down(swap,opt)+down(swap,opt) | 238 | - |
| `suzuci-53-biku826` | links | 129 | - |
| `tamaxe-36-mono574` | down | 244 | - |
| `tobajo-64-mipi810` | down+down+down+down | 942 | yes |
| `tuneta-22-mega154` | links+links | 351 | yes |
| `vaxiki-78-nice114` | down(swap,opt) | 128 | - |
| `vaxuta-95-cico162` | down(swap,opt)+down(swap,opt)+links | 325 | - |
| `vebala-15-tade547` | down+down+down(swap,opt)+links+links+links | 704 | - |
| `vidada-17-xuse810` | down | 239 | yes |
| `vimako-25-mega336` | down(swap) | 116 | - |
| `vivate-04-guso306` | down+long | 298 | - |
| `vozane-63-kepe177` | down+links | 262 | - |
| `vubolo-48-cubu499` | down | 408 | - |
| `xabesu-51-dimi831` | down | 214 | - |
| `xarumo-26-zinu467` | down | 221 | yes |
| `xefalo-73-sabi101` | down+down+down(swap,opt)+links+links+links | 704 | - |
| `xigelo-67-sipi599` | links+links | 255 | - |
| `zepima-96-peco612` | links | 355 | - |
| `zeporo-46-zicu301` | long+down | 372 | yes |
| `zivege-92-rise076` | links+links | 270 | - |
| `zukori-83-fiso705` | down+down | 273 | - |
