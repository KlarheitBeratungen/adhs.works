# adhs.works – Arbeitsregeln für Claude

Website für Coaching für Erwachsene mit ADHS von Markus Wagner (Münster). Eigenständiges Projekt
innerhalb von Klarheit Beratungen. Seiten: index (eine lange Startseite) · impressum · datenschutz · 404.
Die Beratungs-Website ist klarheit-beratungen.de (Repo `KlarheitBeratungen/klarheit-beratungen.de`),
die persönliche Website markuswagner.live (Repo `KlarheitBeratungen/markuswagner.live`).

## Zusammenarbeit
- Markus auf Deutsch und mit „du“ ansprechen. **Auf dieser Website gilt ebenfalls „du“** (Markus' Vorgabe vom 14.10.2026, anders als auf klarheit-beratungen.de), kleingeschrieben, auch in Formular, Bestätigungsmail und Datenschutz.
- **Ton:** super nett und nahbar, wie jemand, der zuhört, versteht und Raum für die eigenen Gedanken gibt. Warm, persönlich („ich“), ohne Druck. Aber nie auf Kosten der Abgrenzung zur Therapie (Regel 5).
- Er ist kein Entwickler: Ergebnisse knapp und ohne Fachjargon erklären.
- **Veröffentlicht wird erst, wenn Markus „umsetzen“ o. ä. sagt.**

## Veröffentlichen
- Hostinger holt jeden Stand von `main` automatisch nach `public_html` (Hostinger-GitHub-App), sobald die Website adhs.works in Hostinger mit diesem Repo verbunden ist.
- **Cloud-Sitzung:** Änderung auf dem Arbeitszweig pushen und einen Pull Request erstellen. Markus führt ihn auf GitHub zusammen, erst dann ist die Änderung online.
- **Lokal auf Markus' PC:** vor jeder Arbeit `git pull`; nach „umsetzen“ `git push origin main`.
- Danach live prüfen: Seiten laden (HTTP 200, neuer Inhalt da). Das Terminplaner-Skript nur ohne Mailversand prüfen: GET → 405, POST `{}` → 422, POST `{"website":"x"}` → `{"ok":true}`. **Nie echte Test-Mails oder Testbuchungen verschicken**, die macht Markus selbst.

## Harte Regeln
1. **Trennung der Auftritte:** Von klarheit-beratungen.de und markuswagner.live führt kein Link hierher, dort kommt ADHS nirgends vor. Hier gibt es keinen Link dorthin und kein Klarheit-Logo. Klarheit Beratungen steht nur dezent in der Fußzeile („Ein Angebot von Klarheit Beratungen“) sowie, weil gesetzlich nötig, in Impressum und Datenschutz. Keine `sameAs`- oder `parentOrganization`-Verweise in den strukturierten Daten.
2. **Überall, wo man ein Erstgespräch anfragen kann, gibt es den Terminplaner mit Kalender**, nie nur einen Button.
3. **Design für Menschen mit ADHS:** eine Botschaft pro Abschnitt, kurze Absätze, „Kurz gesagt“-Kasten oben, nummerierte Abschnitte mit Sprungmarken, am Ende jedes Abschnitts ein klarer nächster Schritt. Keine Animationen, Karussells, Pop-ups oder automatisch startenden Medien. Kontraste mindestens 4,5 : 1, deutliche Fokus-Rahmen.
4. Responsiv bauen (Handy ab 375 px ohne seitliches Überlaufen) und vor dem Veröffentlichen prüfen.
5. **Abgrenzung zu Heilkunde und Psychotherapie (Heilpraktikergesetz, Psychotherapeutengesetz, Heilmittelwerbegesetz).** Markus hat keine Heilerlaubnis. Die Website darf nicht den Eindruck erwecken, es gehe um Feststellung, Heilung oder Linderung von ADHS.
   - Gegenstand des Coachings sind berufliche und persönliche **Anliegen**: das, was die Menschen wollen und brauchen (Beruf, Arbeitsumfeld, Studium, Entscheidungen, Stärken). ADHS beschreibt nur, für wen das Angebot ist, nie den Gegenstand: „Coaching für Erwachsene mit ADHS“, nicht „ADHS-Coaching“.
   - Markus' Vorgaben (14.10.2026): **kein „Ziel/Ziele“** auf der Website (ersetzt durch Anliegen, Vorhaben, „was Sie wollen und was Sie brauchen“); **kein Thema „Alltag organisieren“**; „Alltag“ nur im Sinn von „im täglichen Leben“. Der 4-Schritt-Prozess beginnt hier mit **„Anliegen klären“** (statt „Probleme entdecken“ wie auf klarheit-beratungen.de). Spitzenzitat in der Mitte: „Coaching beginnt bei dem, was du willst und was du brauchst – nicht bei einer Diagnose.“ Nicht ungefragt umschreiben.
   - Klar und an mehreren Stellen sagen: **keine Therapie, keine Behandlung von Beschwerden, Symptomen oder ADHS-bedingten Problemen, keine Diagnosen** (Kasten „Wichtig: Coaching ist keine Therapie“ unter „Kurz gesagt“, Hero, FAQ „Ist das eine Therapie?“, Fußzeile aller Seiten, Impressum, Hinweis im Formular).
   - **Verbotene Wörter und Motive:** „Strategie/Strategien“ (Markus' Vorgabe), Symptome als Erkennungsliste („Kommt Ihnen das bekannt vor?“), Aufschieben, Fokus/Konzentration, Zeitgefühl, Reize, Überforderung, Erschöpfung, Energie, Hyperfokus, Muster, „Ihr Kopf“, „mit Ihrem ADHS arbeiten“, Aussagen über das Wesen von ADHS, Heil- oder Erfolgsversprechen, „ergänzt die Therapie“, „Rezept“. Die Wörter Diagnose, Therapie, Behandlung, Beschwerden, Symptome nur in Abgrenzungs-Sätzen.
   - Keine Behauptungen über Markus' Qualifikation oder Erfahrung mit ADHS, die er nicht selbst geliefert hat.

## Preise (Stand 14.10.2026)
- Abschnitt „Pakete und Preise“ (`#preise`) auf der Startseite, dazu die FAQ „Was kostet das Coaching?“. Bei Änderungen beide Stellen pflegen.
- Kundschaft sind Privatpersonen: **nur Endpreise inkl. 19 % USt.** (Preisangabenverordnung), auf volle Euro aufgerundet (Markus' Vorgabe). Markus ist regelbesteuert.
- Netto → Endpreis: Lichtblick 60 Min 108 → **129 €**, 90 Min 150 → **179 €** · Überblick 3 × 90 Min 430 → **512 €** · Durchblick 6 × 90 Min 820 → **976 €** · Klarheit 10 × 90 Min 1.250 → **1.488 €**.
- Paketnamen in dieser Reihenfolge (Markus' Wahl): Lichtblick · Überblick · Durchblick · **Klarheit** (höchste Stufe). Kein „Einblick“.
- Das Formular hat kein Feld „Anrede“ mehr (beim Duzen überflüssig).
- Konditionen (Markus, 14.10.2026), Kasten „Gut zu wissen“ unter den Paketen: Termindichte frei wählbar, Paket läuft längstens so viele Monate, wie es Termine hat (3/6/10 Monate) · Bezahlung per Rechnung · Absage am Vortag bis 18 Uhr: 70 % des Terminpreises, am selben Tag oder Nichterscheinen: 100 %.
- Angezeigt werden Paketpreis, „rund … € pro Termin“ (gerundet) und „Sie sparen … €“ gegenüber 179 € je Einzeltermin. Keine Stundensätze. Erstgespräch bis 45 Min bleibt kostenlos.

## Technik
- Statisches HTML/CSS/Vanilla-JS ohne Build. Design-System: `assets/css/style.css` (Indigo `#4338ca` + Bernstein `#f2a93b` auf warmem Papierton). Schriften lokal: Atkinson Hyperlegible (Text) und Lexend (Überschriften), beide SIL OFL.
- Cache: HTML wird nicht zwischengespeichert, CSS/JS dagegen lange. **Bei jeder Änderung an `booking.js` oder `style.css` die `?v=`-Nummer in allen Seiten hochzählen, die die Datei einbinden** (Stand: `style.css?v=4` in allen 4 Seiten, `booking.js?v=3` in index.html, `og-image.png?v=4`; in `404.html` stehen die Pfade mit führendem `/`).
- Terminplaner: `assets/js/booking.js` → `send-booking.php` → Mail an wagner@klarheit-beratungen.de und automatische Eingangsbestätigung an den Anfragenden. Es gibt nur ein Anliegen, `Erstgespräch Coaching`. **Wird das Label oder das Terminformat in booking.js geändert, muss `$AREAS`/`$WHEN_RE` in send-booking.php mitgeändert werden**, sonst entfällt die Bestätigung stillschweigend. Die Bestätigung enthält bewusst weder Freitext noch das Wort „ADHS“ (falls jemand eine fremde Adresse einträgt).
- **Einwilligung (Art. 9 DSGVO):** Eine Anfrage für ADHS-Coaching kann Gesundheitsdaten enthalten. Das Häkchen im Formular ist Pflicht und wird in send-booking.php geprüft (ohne → 422). Die Datenschutzerklärung (Ziffer 5 und 6) beschreibt das; bei Änderungen am Formular mitprüfen.
- Versand per SMTP über `smtp-mail.php` (gleiche Datei wie auf klarheit-beratungen.de), bei Fehlern Rückfall auf PHP `mail()`. Die Zugangsdaten stehen in `mail-config.php` **außerhalb** von public_html auf dem Server: nie ins Repo, nie nach Passwörtern fragen oder sie eintragen.
- `.htaccess`: HTTPS- und www-Weiterleitung, Sicherheits-Header mit CSP (`script-src 'self'` → kein Inline-JavaScript), jeder Pfad mit Punkt am Anfang → 403 (nur `.well-known` bleibt frei).
- Bilder: `logo.svg` (Kopf und Browser-Symbol), `favicon.png` und `logo-180.png` als Ersatz, `og-image.png` als Vorschaubild für geteilte Links.

## Nicht ins Repo
`.claude/` (außer dieser Datei), `ausserhalb-public_html/`, Passwörter, `*.log`.
