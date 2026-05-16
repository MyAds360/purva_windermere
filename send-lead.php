<?php
/**
 * Sends lead form data to digital.myads360@gmail.com
 * Use with PHP hosting (cPanel, etc.).
 */
header('Content-Type: application/json; charset=UTF-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Accept');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit;
}

$name  = trim(strip_tags($_POST['name'] ?? ''));
$email = trim($_POST['email'] ?? '');
$phone = trim(strip_tags($_POST['phone'] ?? ''));

if ($name === '' || $phone === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Invalid form data']);
    exit;
}

$to      = 'digital.myads360@gmail.com';
$subject = 'New Lead — Purva Windermere Bangalore';
$body    = "New lead from the Purva Windermere landing page\r\n\r\n"
         . "Name:  {$name}\r\n"
         . "Email: {$email}\r\n"
         . "Phone: {$phone}\r\n"
         . "Time:  " . date('Y-m-d H:i:s T') . "\r\n"
         . "IP:    " . ($_SERVER['REMOTE_ADDR'] ?? 'unknown') . "\r\n";

$fromDomain = $_SERVER['HTTP_HOST'] ?? 'purva-windermere.local';
$headers    = "MIME-Version: 1.0\r\n"
            . "Content-Type: text/plain; charset=UTF-8\r\n"
            . "From: Purva Windermere Leads <noreply@{$fromDomain}>\r\n"
            . "Reply-To: {$name} <{$email}>\r\n";

$sent = @mail($to, $subject, $body, $headers);

echo json_encode([
    'success' => (bool) $sent,
    'message' => $sent ? 'Email sent' : 'Mail server could not send email',
]);
