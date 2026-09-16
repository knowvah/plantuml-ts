# Affected fixtures (PROVISIONAL — T1 rewrites this file)

Every `status: "baseline"` fixture of `oracle/goldens/svg-activity/diff-baseline.json`
whose markup contains an `if` (123 of 268), with its pin at `b79502b5`. The
`builder` column is a MARKUP guess (`elseif` present -> `long`; an `else` with
content -> `links`; no `else` -> `down`; several `if`s -> `mixed`) made during
planning; it does NOT detect an `else` holding only a lone `stop`/`end`/`kill`
(`InstructionList.isOnlySingleStopOrSpot`, `InstructionList.java:90-106`),
which the jar routes to `FtileIfDown`. T1 replaces this column with the
dispatch's real answer per `if` (a fixture may hold several builders) and
adds the three representative slugs per builder it dumped.

Pin sums by guessed builder: long 8303 · down 5659 · links 9608 · mixed 10339 — total 33909 of aggregate 52067.

| slug | builder (guess) | pin | laned |
|---|---|---|---|
| `cagoze-40-tete366` | down | 137 | - |
| `cemipu-87-dinu624` | down | 239 | yes |
| `cixave-47-milo698` | down | 245 | - |
| `dacuga-41-popo038` | down | 215 | - |
| `dixiku-28-guzo497` | down | 192 | - |
| `fonabu-93-xama593` | down | 133 | - |
| `gelono-70-zuce760` | down | 219 | - |
| `jipapo-14-kevu587` | down | 178 | - |
| `jisema-42-rapa121` | down | 160 | - |
| `lacuci-13-nogo718` | down | 151 | - |
| `letuke-04-poza319` | down | 227 | yes |
| `livigo-47-negi605` | down | 145 | - |
| `nijipa-25-pede639` | down | 127 | - |
| `nikinu-06-sace939` | down | 237 | yes |
| `nimusa-16-tiku252` | down | 189 | - |
| `nusajo-97-bemo713` | down | 145 | - |
| `pedoco-30-mose082` | down | 185 | - |
| `pujozo-36-nino158` | down | 167 | yes |
| `raruzu-62-giro837` | down | 237 | yes |
| `rosizo-69-mera514` | down | 242 | - |
| `sigofi-46-gaja158` | down | 199 | - |
| `sucice-41-pebi088` | down | 236 | yes |
| `tamaxe-36-mono574` | down | 244 | - |
| `vaxiki-78-nice114` | down | 128 | - |
| `vidada-17-xuse810` | down | 239 | yes |
| `vubolo-48-cubu499` | down | 408 | - |
| `xabesu-51-dimi831` | down | 214 | - |
| `xarumo-26-zinu467` | down | 221 | yes |
| `bareka-88-fusu160` | links | 242 | - |
| `bazuma-86-metu353` | links | 163 | - |
| `becaje-01-vaji284` | links | 160 | - |
| `bedezo-44-more709` | links | 189 | - |
| `bideta-97-cezo697` | links | 178 | yes |
| `bidosa-98-veca008` | links | 176 | - |
| `bocaga-53-nale241` | links | 118 | - |
| `bolizi-92-pele824` | links | 300 | - |
| `bozuro-33-celo170` | links | 198 | - |
| `carapo-31-bisi880` | links | 106 | - |
| `copisa-69-xisi273` | links | 154 | - |
| `cujoni-21-somi079` | links | 211 | - |
| `daxare-39-buci637` | links | 198 | - |
| `decudi-92-bisu741` | links | 366 | yes |
| `dotuzi-75-nape254` | links | 243 | - |
| `dozaxu-98-xetu961` | links | 210 | - |
| `dulezi-77-sana210` | links | 184 | - |
| `feceme-58-xodo415` | links | 133 | - |
| `ganaku-47-muko252` | links | 223 | - |
| `gevaxi-80-tone223` | links | 220 | - |
| `javedu-70-vaxo310` | links | 164 | - |
| `jecoxu-17-zama003` | links | 136 | - |
| `jevoce-05-mumi686` | links | 375 | yes |
| `kafevi-44-tesu096` | links | 205 | - |
| `kepavi-26-sasu141` | links | 175 | - |
| `kitupi-32-jexo155` | links | 172 | - |
| `lafilo-69-tuti771` | links | 175 | - |
| `loxija-71-joku558` | links | 237 | - |
| `lukoxa-16-cecu095` | links | 128 | yes |
| `maketa-43-juja264` | links | 276 | yes |
| `manata-12-rido730` | links | 257 | yes |
| `movexa-27-rexe388` | links | 178 | yes |
| `nafaxo-62-boso912` | links | 299 | - |
| `nupose-71-vido428` | links | 365 | yes |
| `pezubu-98-niba240` | links | 192 | yes |
| `pifoni-76-duxa505` | links | 255 | - |
| `pirofe-41-xama594` | links | 210 | - |
| `relufo-04-fezo835` | links | 179 | - |
| `rerovo-62-nazo755` | links | 106 | - |
| `roboja-69-susa752` | links | 365 | yes |
| `samavi-13-fuku339` | links | 174 | yes |
| `saxeku-17-gume203` | links | 151 | - |
| `sokapa-71-tifi543` | links | 262 | - |
| `suzuci-53-biku826` | links | 129 | - |
| `vimako-25-mega336` | links | 116 | - |
| `zepima-96-peco612` | links | 355 | - |
| `bazize-75-dedo568` | long | 354 | - |
| `bepuku-07-vebe062` | long | 343 | - |
| `biredi-08-bama025` | long | 314 | - |
| `boxoto-53-sifo232` | long | 1033 | - |
| `fatuzu-07-cevu894` | long | 270 | - |
| `fetizo-39-jace641` | long | 235 | - |
| `gitoke-38-beme495` | long | 639 | - |
| `jafuli-91-sota277` | long | 301 | - |
| `jucidi-98-zato093` | long | 219 | yes |
| `jupoxe-15-sugo110` | long | 1974 | - |
| `leduvi-16-voli986` | long | 356 | - |
| `levuma-67-cego489` | long | 244 | - |
| `lifeve-53-zubi598` | long | 123 | - |
| `lufamo-62-xavo766` | long | 314 | - |
| `mabuke-20-muco282` | long | 331 | - |
| `nojije-35-teta491` | long | 250 | yes |
| `pekefu-66-mepa144` | long | 159 | - |
| `sofoje-37-tila554` | long | 174 | - |
| `vivate-04-guso306` | long | 298 | - |
| `zeporo-46-zicu301` | long | 372 | yes |
| `bizono-61-sasa740` | mixed | 247 | - |
| `calenu-74-vigo098` | mixed | 305 | - |
| `ciceto-21-zanu057` | mixed | 247 | - |
| `doziki-93-rosi997` | mixed | 307 | - |
| `fibafo-22-foze119` | mixed | 501 | - |
| `fivama-51-cusa142` | mixed | 175 | - |
| `gacaja-15-keko600` | mixed | 443 | - |
| `gakelo-29-neno787` | mixed | 243 | - |
| `jagove-43-nako107` | mixed | 360 | - |
| `judatu-15-xize591` | mixed | 577 | yes |
| `jupivo-67-gidi531` | mixed | 314 | - |
| `maduja-30-xiri319` | mixed | 308 | yes |
| `navene-45-cozo466` | mixed | 582 | yes |
| `nonusu-50-nute147` | mixed | 266 | - |
| `pixako-75-kumi821` | mixed | 231 | - |
| `pokoro-73-bili712` | mixed | 322 | - |
| `rujuxa-07-neco067` | mixed | 484 | yes |
| `ruzica-16-deli877` | mixed | 514 | yes |
| `secepo-00-febi326` | mixed | 284 | - |
| `sokafe-69-jita472` | mixed | 247 | - |
| `sutura-08-zeme419` | mixed | 238 | - |
| `tuneta-22-mega154` | mixed | 351 | yes |
| `vaxuta-95-cico162` | mixed | 325 | - |
| `vebala-15-tade547` | mixed | 704 | - |
| `vozane-63-kepe177` | mixed | 262 | - |
| `xefalo-73-sabi101` | mixed | 704 | - |
| `xigelo-67-sipi599` | mixed | 255 | - |
| `zivege-92-rise076` | mixed | 270 | - |
| `zukori-83-fiso705` | mixed | 273 | - |
