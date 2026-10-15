$ErrorActionPreference = 'Stop'
$base = 'http://localhost:8080'
$session = New-Object Microsoft.PowerShell.Commands.WebRequestSession
$email = "profile-check-$([DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds())@example.test"
$created = $false
function CallApi($method, $path, $body = $null) {
  $args = @{ Uri="$base$path"; Method=$method; WebSession=$session; ContentType='application/json' }
  $cookie = $session.Cookies.GetCookies($base)['XSRF-TOKEN']
  if ($cookie) { $args.Headers = @{ 'X-XSRF-TOKEN'=[Uri]::UnescapeDataString($cookie.Value) } }
  if ($null -ne $body) { $args.Body = ConvertTo-Json $body -Depth 12 }
  try { Invoke-RestMethod @args } catch {
    if ($_.Exception.Response) { $reader = New-Object IO.StreamReader($_.Exception.Response.GetResponseStream()); Write-Host $reader.ReadToEnd() }
    throw
  }
}
try {
  CallApi POST '/api/auth/register' @{name='Profile persistence check';email=$email;password='ProfileCheck839!';role='DEVELOPER';acceptedTerms=$true;turnstileToken='XXXX.DUMMY.TOKEN.XXXX'} | Out-Null
  $created=$true
  CallApi GET '/api/auth/csrf' | Out-Null
  $payload = @{title='Persistence check';summary='Saved profile details';image='';skills=@('React');contactLinks=@{linkedinUrl='';githubUrl='https://github.com/example';email=$email;websiteUrl=''};preferences=@{availability='Open to contract roles';seniorityLevels=@('Mid-level','Senior');remotePreference='London';workTypes=@('Security','DevOps & Cloud')};projects=@();posts=@();displayed=$false}
  CallApi PATCH '/api/developer/profile' $payload | Out-Null
  $session = New-Object Microsoft.PowerShell.Commands.WebRequestSession
  CallApi POST '/api/auth/login' @{email=$email;password='ProfileCheck839!'} | Out-Null
  CallApi GET '/api/auth/csrf' | Out-Null
  $saved = CallApi GET '/api/developer/profile'
  if ($saved.preferences.availability -ne 'Open to contract roles' -or ($saved.preferences.seniorityLevels -join ',') -ne 'Mid-level,Senior' -or ($saved.preferences.workTypes -join ',') -ne 'Security,DevOps & Cloud' -or $saved.preferences.remotePreference -ne 'London' -or $saved.contactLinks.githubUrl -ne 'https://github.com/example') { throw 'Saved profile differs after fresh login' }
  $payload.preferences.seniorityLevels=@(); $payload.preferences.workTypes=@(); $payload.contactLinks.githubUrl=''; $payload.preferences.remotePreference=''
  CallApi PATCH '/api/developer/profile' $payload | Out-Null
  $saved=CallApi GET '/api/developer/profile'
  if ($saved.preferences.seniorityLevels.Count -ne 0 -or $saved.preferences.workTypes.Count -ne 0 -or $saved.contactLinks.githubUrl -ne '' -or $saved.preferences.remotePreference -ne '') { throw 'Cleared fields were restored' }
  'PASS: preferences and contact links persist across fresh login; cleared fields stay empty.'
} finally {
  if($created) { CallApi DELETE '/api/auth/account' | Out-Null; 'Temporary test account removed.' }
}

