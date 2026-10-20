<?php
/* ===================================================================
   smtp-mail.php · Mailversand über das eigene Postfach (SMTP)
   Wird von den Formular-Skripten eingebunden und meldet sich – wie ein
   Mailprogramm – bei smtp.hostinger.com an. So sind die Mails für Gmail
   & Co. eindeutig als Mails der eigenen Domain erkennbar (PHP mail() geht
   dagegen vom Webserver aus, der dafür nicht freigegeben ist).
   Zugangsdaten: mail-config.php EINE EBENE ÜBER public_html (aus dem Web
   nicht erreichbar). Fehlt sie oder klappt der Versand nicht, liefert
   smtp_send() false – die Skripte nutzen dann wie bisher mail().
   Fehler landen ohne Adressen in mail-smtp.log (ebenfalls über public_html).
   Liegt im Web-Root (public_html/) neben den Formular-Skripten.
   =================================================================== */

// Direkter Aufruf im Browser: nichts preisgeben
if (isset($_SERVER['SCRIPT_FILENAME']) && basename($_SERVER['SCRIPT_FILENAME']) === basename(__FILE__)) {
  http_response_code(404);
  exit;
}

function smtp_log($msg) {
  $file = defined('MAIL_LOG') ? MAIL_LOG : dirname(__DIR__) . '/mail-smtp.log';
  $msg  = preg_replace('/[A-Za-z0-9._%+-]+@([A-Za-z0-9.-]+\.[A-Za-z]{2,})/', '***@$1', $msg);   // keine Adressen im Log
  $now  = new DateTime('now', new DateTimeZone('Europe/Berlin'));
  @file_put_contents($file, '[' . $now->format('d.m.Y H:i:s') . '] ' . trim(preg_replace('/\s+/', ' ', $msg)) . "\n", FILE_APPEND);
}

function smtp_config() {
  static $cfg = null;
  if ($cfg !== null) { return $cfg; }
  $cfg  = false;
  $file = defined('MAIL_CONFIG') ? MAIL_CONFIG : dirname(__DIR__) . '/mail-config.php';
  if (!@is_file($file)) { return $cfg; }
  try {
    $c = include $file;
  } catch (Throwable $e) {
    // Fehlermeldung bewusst nicht protokollieren – sie könnte Teile des Passworts enthalten
    smtp_log('mail-config.php enthält einen Fehler (Zeile ' . $e->getLine() . ')');
    return $cfg;
  }
  if (is_array($c) && !empty($c['host']) && !empty($c['user']) && isset($c['pass'])
      && $c['pass'] !== '' && $c['pass'] !== 'HIER-PASSWORT-EINTRAGEN') {
    $cfg = $c;
  }
  return $cfg;
}

// Anzeigename für Kopfzeilen: ohne Zeilenumbrüche, Umlaute RFC-2047-kodiert
function smtp_addr($name, $addr) {
  $name = trim(str_replace(array("\r", "\n", '"', '\\'), array(' ', ' ', "'", ''), (string) $name));
  if ($name === '') { return '<' . $addr . '>'; }
  if (preg_match('/[^\x20-\x7E]/', $name)) { $name = '=?UTF-8?B?' . base64_encode($name) . '?='; }
  else { $name = '"' . $name . '"'; }
  return $name . ' <' . $addr . '>';
}

function smtp_subject($s) {
  $s = str_replace(array("\r", "\n"), ' ', (string) $s);
  if (!preg_match('/[^\x20-\x7E]/', $s)) { return $s; }
  if (function_exists('mb_encode_mimeheader')) { return mb_encode_mimeheader($s, 'UTF-8', 'B', "\r\n", 9); }
  return '=?UTF-8?B?' . base64_encode($s) . '?=';
}

// Alles schreiben – bei verschlüsselten Verbindungen kommt fwrite() evtl. nur stückweise durch
function smtp_write($fp, $str) {
  $len = strlen($str);
  for ($done = 0; $done < $len; $done += $n) {
    $n = fwrite($fp, substr($str, $done));
    if ($n === false || $n === 0) { return false; }
  }
  return true;
}

// Antwort lesen, auch mehrzeilig ("250-…" bis "250 …")
function smtp_read($fp) {
  $resp = '';
  while (($line = fgets($fp, 1024)) !== false) {
    $resp .= $line;
    if (!isset($line[3]) || $line[3] !== '-') { break; }
  }
  return $resp;
}

/**
 * Verschickt eine Text-Mail über das Postfach aus mail-config.php.
 * Absender ist immer dieses Postfach. $replyTo = array(Name, Adresse) oder null.
 * Gibt true zurück, sobald der Mailserver die Mail angenommen hat.
 */
function smtp_send($to, $subject, $body, $fromName, $replyTo = null, $extraHeaders = array()) {
  $cfg = smtp_config();
  if (!$cfg) { return false; }
  $from      = $cfg['user'];
  $transport = isset($cfg['transport']) ? $cfg['transport'] : 'ssl';
  $port      = isset($cfg['port']) ? (int) $cfg['port'] : 465;

  $ctx = stream_context_create(array('ssl' => array('verify_peer' => true, 'verify_peer_name' => true, 'peer_name' => $cfg['host'])));
  $fp  = @stream_socket_client($transport . '://' . $cfg['host'] . ':' . $port, $errno, $errstr, 8, STREAM_CLIENT_CONNECT, $ctx);
  if (!$fp) { smtp_log('Verbindung zu ' . $cfg['host'] . ' fehlgeschlagen: ' . $errno . ' ' . $errstr); return false; }
  stream_set_timeout($fp, 8);

  // Nachricht zusammenbauen: Text als quoted-printable (7-Bit-sicher)
  $h = array();
  $h[] = 'Date: ' . date('r');
  $h[] = 'Message-ID: <' . bin2hex(random_bytes(12)) . '@' . substr(strrchr($from, '@'), 1) . '>';
  $h[] = 'From: ' . smtp_addr($fromName, $from);
  $h[] = 'To: <' . $to . '>';
  if (is_array($replyTo)) { $h[] = 'Reply-To: ' . smtp_addr($replyTo[0], $replyTo[1]); }
  $h[] = 'Subject: ' . smtp_subject($subject);
  $h[] = 'MIME-Version: 1.0';
  $h[] = 'Content-Type: text/plain; charset=UTF-8';
  $h[] = 'Content-Transfer-Encoding: quoted-printable';
  foreach ($extraHeaders as $line) { $h[] = $line; }
  $body = str_replace("\n", "\r\n", str_replace(array("\r\n", "\r"), "\n", (string) $body));
  $data = implode("\r\n", $h) . "\r\n\r\n" . quoted_printable_encode($body);
  $data = preg_replace('/^\./m', '..', $data);   // Punkt am Zeilenanfang verdoppeln (SMTP-Regel)

  $steps = array(
    array(null, 220, 'Begrüßung'),
    array('EHLO ' . substr(strrchr($from, '@'), 1), 250, 'EHLO'),
    array('AUTH LOGIN', 334, 'AUTH'),
    array(base64_encode($cfg['user']), 334, 'Benutzername'),
    array(base64_encode($cfg['pass']), 235, 'Passwort'),
    array('MAIL FROM:<' . $from . '>', 250, 'Absender'),
    array('RCPT TO:<' . $to . '>', array(250, 251), 'Empfänger'),
    array('DATA', 354, 'DATA'),
    array($data . "\r\n.", 250, 'Nachricht'),
  );
  $ok = true;
  foreach ($steps as $s) {
    if ($s[0] !== null && !smtp_write($fp, $s[0] . "\r\n")) {
      smtp_log('Senden abgebrochen bei ' . $s[2]);
      $ok = false;
      break;
    }
    $resp = smtp_read($fp);
    if (!in_array((int) substr($resp, 0, 3), (array) $s[1], true)) {
      $info = stream_get_meta_data($fp);
      smtp_log('Abbruch bei ' . $s[2] . ': ' . ($resp !== '' ? $resp : ($info['timed_out'] ? 'Zeitüberschreitung' : 'keine Antwort')));
      $ok = false;
      break;
    }
  }
  @fwrite($fp, "QUIT\r\n");
  fclose($fp);
  return $ok;
}
