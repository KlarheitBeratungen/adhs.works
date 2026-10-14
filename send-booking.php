<?php
/* ===================================================================
   send-booking.php · Terminanfrage-Handler für adhs.works
   Nimmt die Anfrage des Terminplaners (assets/js/booking.js) per POST
   entgegen, schickt sie als E-Mail an Markus und dem Anfragenden eine
   automatische Eingangsbestätigung. Antwort als JSON.
   Versand über das Postfach (smtp-mail.php + mail-config.php); klappt
   das nicht, per mail().
   Liegt im Web-Root (public_html/) neben index.html.
   =================================================================== */

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');

// Fehlt smtp-mail.php oder ist sie defekt, läuft alles über mail()
try { if (is_file(__DIR__ . '/smtp-mail.php')) { require_once __DIR__ . '/smtp-mail.php'; } } catch (Throwable $e) {}

// --- Empfänger & Absender ------------------------------------------
// Absender = echtes Postfach (SPF/DKIM/DMARC bei Hostinger vorhanden).
// Gibt es später ein eigenes Postfach @adhs.works, hier und in booking.js
// (CONFIG.email) umstellen.
$TO        = 'wagner@klarheit-beratungen.de';
$FROM_ADDR = 'wagner@klarheit-beratungen.de';
$FROM_NAME = 'Markus Wagner';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
  http_response_code(405);
  echo json_encode(array('ok' => false, 'error' => 'method'));
  exit;
}

$raw  = file_get_contents('php://input');
$data = json_decode($raw, true);
if (!is_array($data)) { $data = $_POST; }

function val($d, $k) { return isset($d[$k]) ? trim((string) $d[$k]) : ''; }
function noHeader($s) { return str_replace(array("\r", "\n", "%0a", "%0d"), ' ', $s); }

// Honeypot
if (val($data, 'website') !== '') { echo json_encode(array('ok' => true)); exit; }

$name    = val($data, 'name');
$email   = val($data, 'email');
$anrede  = val($data, 'anrede');
$phone   = val($data, 'phone');
$area    = val($data, 'area');
$when    = val($data, 'when');
$msg     = val($data, 'msg');
// Einwilligung (Art. 9 DSGVO): ohne Häkchen keine Verarbeitung
$consent = isset($data['consent']) && ($data['consent'] === true || $data['consent'] === 'true' || $data['consent'] === '1');

$fields = array();
if ($name === '')                               { $fields[] = 'name'; }
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) { $fields[] = 'email'; }
if ($area === '' || $when === '')               { $fields[] = 'termin'; }
if (!$consent)                                  { $fields[] = 'consent'; }
if (count($fields) > 0) {
  http_response_code(422);
  echo json_encode(array('ok' => false, 'error' => 'validation', 'fields' => $fields));
  exit;
}

$now = new DateTime('now', new DateTimeZone('Europe/Berlin'));

$subject = 'Terminanfrage Coaching (adhs.works)';
$body =
  "Neue Terminanfrage über adhs.works\n" .
  "----------------------------------\n\n" .
  "Anliegen:      " . $area . "\n" .
  "Wunschtermin:  " . $when . "\n\n" .
  "Anrede:        " . ($anrede !== '' ? $anrede : '—') . "\n" .
  "Name:          " . $name . "\n" .
  "E-Mail:        " . $email . "\n" .
  "Telefon:       " . ($phone !== '' ? $phone : '—') . "\n\n" .
  "Was ich angehen möchte:\n" . ($msg !== '' ? $msg : '—') . "\n\n" .
  "Einwilligung (Art. 9 DSGVO) erteilt am " . $now->format('d.m.Y \u\m H:i') . " Uhr.\n\n" .
  "(Unverbindliche Anfrage – bitte um kurze Bestätigung.)\n";

$headers  = array();
$headers[] = 'From: ' . $FROM_NAME . ' <' . $FROM_ADDR . '>';
$headers[] = 'Reply-To: ' . noHeader($name) . ' <' . noHeader($email) . '>';
$headers[] = 'MIME-Version: 1.0';
$headers[] = 'Content-Type: text/plain; charset=UTF-8';
$headers[] = 'Content-Transfer-Encoding: 8bit';

$sent = function_exists('smtp_send') && smtp_send($TO, $subject, $body, $FROM_NAME, array($name, $email));
if (!$sent) {
  $sent = @mail($TO, '=?UTF-8?B?' . base64_encode($subject) . '?=', $body, implode("\r\n", $headers), '-f' . $FROM_ADDR);
}

// --- Eingangsbestätigung an den Anfragenden -------------------------
// Nur Anliegen und Wunschtermin, kein Freitext: So lässt sich das Formular
// nicht missbrauchen, um beliebige Texte an fremde Adressen zu schicken.
// Bewusst ohne das Wort „ADHS“ in Absender, Betreff und Text, falls jemand
// eine fremde Adresse einträgt. Anliegen und Termin müssen genau dem
// entsprechen, was booking.js sendet.
$AREAS   = array('Erstgespräch Coaching');
$WHEN_RE = '/^(Montag|Dienstag|Mittwoch|Donnerstag|Freitag), ([1-9]|[12][0-9]|3[01])\. (Januar|Februar|März|April|Mai|Juni|Juli|August|September|Oktober|November|Dezember) [0-9]{4}, [0-2][0-9]:[0-5][0-9]–[0-2][0-9]:[0-5][0-9] Uhr \([0-9]{1,3} Min\)$/u';

if ($sent && in_array($area, $AREAS, true) && preg_match($WHEN_RE, $when) === 1) {
  // Den Namen nur in die Anrede übernehmen, wenn er wie ein Name aussieht (keine Links o. Ä.)
  $nameOk = preg_match('/^[\p{L}\p{M}][\p{L}\p{M} .\'’-]{0,79}$/u', $name) === 1 && preg_match('/\.\p{L}/u', $name) !== 1;
  $bodyConfirm =
    ($nameOk ? 'Guten Tag ' . $name . ',' : 'Guten Tag,') . "\n\n" .
    "vielen Dank für Ihre Anfrage, sie ist bei mir eingegangen:\n\n" .
    "Anliegen:      " . $area . "\n" .
    "Wunschtermin:  " . $when . "\n\n" .
    "Die Anfrage ist unverbindlich. Ich melde mich zeitnah, um den Termin zu bestätigen. " .
    "Wenn etwas nicht passt, antworten Sie einfach auf diese E-Mail.\n\n" .
    "Herzliche Grüße\n" .
    "Markus Wagner\n";

  $headersConfirm = array();
  $headersConfirm[] = 'From: ' . $FROM_NAME . ' <' . $FROM_ADDR . '>';
  $headersConfirm[] = 'MIME-Version: 1.0';
  $headersConfirm[] = 'Content-Type: text/plain; charset=UTF-8';
  $headersConfirm[] = 'Content-Transfer-Encoding: 8bit';
  $headersConfirm[] = 'Auto-Submitted: auto-generated';   // verhindert Abwesenheitsnotizen als Antwort

  $subjConfirm = 'Ihre Terminanfrage für ein Erstgespräch';
  if (!(function_exists('smtp_send') && smtp_send($email, $subjConfirm, $bodyConfirm, $FROM_NAME, null, array('Auto-Submitted: auto-generated')))) {
    @mail($email, '=?UTF-8?B?' . base64_encode($subjConfirm) . '?=', $bodyConfirm, implode("\r\n", $headersConfirm), '-f' . $FROM_ADDR);
  }
}

if ($sent) {
  echo json_encode(array('ok' => true));
} else {
  http_response_code(500);
  echo json_encode(array('ok' => false, 'error' => 'send'));
}
