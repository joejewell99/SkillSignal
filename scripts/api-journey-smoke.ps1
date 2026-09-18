param(
    [string]$BaseUrl = "http://localhost:8080"
)

$ErrorActionPreference = "Stop"
$BaseUrl = $BaseUrl.TrimEnd('/')
$password = "JourneySmoke123!"
$stamp = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()
$developerEmail = "journey-dev-$stamp@example.test"
$employerEmail = "journey-emp-$stamp@example.test"
$developerSession = New-Object Microsoft.PowerShell.Commands.WebRequestSession
$employerSession = New-Object Microsoft.PowerShell.Commands.WebRequestSession

function Invoke-Api {
    param(
        [Microsoft.PowerShell.Commands.WebRequestSession]$Session,
        [string]$Method,
        [string]$Path,
        [object]$Body = $null,
        [hashtable]$Headers = @{}
    )

    $request = @{
        Uri = "$script:BaseUrl$Path"
        Method = $Method
        WebSession = $Session
        Headers = $Headers
        ContentType = "application/json"
        UseBasicParsing = $true
    }
    if ($null -ne $Body) {
        $request.Body = $Body | ConvertTo-Json -Depth 8
    }
    Invoke-RestMethod @request
}

function Get-CsrfHeader {
    param([Microsoft.PowerShell.Commands.WebRequestSession]$Session)
    $cookie = $Session.Cookies.GetCookies($script:BaseUrl)["XSRF-TOKEN"]
    if ($null -eq $cookie) {
        throw "CSRF cookie was not issued."
    }
    @{ "X-XSRF-TOKEN" = [Uri]::UnescapeDataString($cookie.Value) }
}

$developerAuth = $null
$employerAuth = $null
try {
    $developerAuth = Invoke-Api $developerSession POST "/api/auth/register" @{
        name = "Journey Developer"
        email = $developerEmail
        password = $password
        role = "DEVELOPER"
        acceptedTerms = $true
    }
    $employerAuth = Invoke-Api $employerSession POST "/api/auth/register" @{
        name = "Journey Employer"
        email = $employerEmail
        password = $password
        role = "EMPLOYER"
        acceptedTerms = $true
    }

    Invoke-Api $developerSession GET "/api/auth/csrf" | Out-Null
    Invoke-Api $employerSession GET "/api/auth/csrf" | Out-Null
    $developerProfile = Invoke-Api $developerSession GET "/api/developer/profile"
    $employerProfile = Invoke-Api $employerSession GET "/api/employer/profile"

    $developerUpdate = @{
        title = "Full-stack developer"
        summary = "Builds dependable products with visible proof."
        image = ""
        skills = @("React", "Spring Boot", "PostgreSQL")
        contactLinks = @{ linkedinUrl = ""; githubUrl = "https://github.com/example"; email = $developerEmail; websiteUrl = "" }
        preferences = @{ availability = "OPEN"; workTypes = @("FULL_TIME"); remotePreference = "REMOTE" }
        projects = @(@{ name = "Journey Proof"; description = "A tested project workflow."; githubUrl = "https://github.com/example/project"; liveUrl = ""; skills = @("React", "Spring Boot"); images = @(); featured = $true })
        posts = @()
        displayed = $true
    }
    $developerProfile = Invoke-Api $developerSession PATCH "/api/developer/profile" $developerUpdate (Get-CsrfHeader $developerSession)
    Invoke-Api $employerSession PATCH "/api/employer/profile/visibility" @{ displayed = $true } (Get-CsrfHeader $employerSession) | Out-Null

    $search = Invoke-Api $employerSession GET "/api/employer/search?problem=authentication"
    $saved = Invoke-Api $employerSession POST "/api/employer/saved-candidates" @{ developerProfileId = $developerProfile.id } (Get-CsrfHeader $employerSession)
    $savedList = Invoke-Api $employerSession GET "/api/employer/saved-candidates"

    $message = Invoke-Api $employerSession POST "/api/employer/messages" @{ receiverProfileId = $developerProfile.id; body = "I would like to discuss your project evidence."; imageUrl = "" } (Get-CsrfHeader $employerSession)
    $developerInbox = Invoke-Api $developerSession GET "/api/developer/messages"
    $accepted = Invoke-Api $developerSession PATCH "/api/developer/messages/$($message.id)/accept" $null (Get-CsrfHeader $developerSession)
    $reply = Invoke-Api $developerSession POST "/api/developer/messages/$($message.id)/reply" @{ body = "Thanks, happy to discuss the implementation."; imageUrl = "" } (Get-CsrfHeader $developerSession)
    $employerInbox = Invoke-Api $employerSession GET "/api/employer/messages"

    [PSCustomObject]@{
        developerRegistered = ($developerAuth.role -eq "DEVELOPER")
        employerRegistered = ($employerAuth.role -eq "EMPLOYER")
        developerProfilePublished = ($developerProfile.id -gt 0 -and $developerProfile.displayed)
        projectProofSaved = ($developerProfile.projects.Count -gt 0)
        employerSearchReturnedMatch = ($search.matches.Count -gt 0)
        candidateSaved = ($saved.developerProfileId -eq $developerProfile.id -and $savedList.Count -gt 0)
        messageRequestCreated = ($message.id -gt 0 -and $developerInbox.Count -gt 0)
        messageAccepted = ($accepted.status -eq "ACTIVE")
        replyDelivered = ($reply.messages.Count -gt 1 -and $employerInbox[0].messages.Count -gt 1)
    } | ConvertTo-Json -Compress
}
finally {
    if ($employerAuth) {
        try { Invoke-Api $employerSession DELETE "/api/auth/account" $null (Get-CsrfHeader $employerSession) | Out-Null } catch { Write-Warning "Employer cleanup failed: $($_.Exception.Message)" }
    }
    if ($developerAuth) {
        try { Invoke-Api $developerSession DELETE "/api/auth/account" $null (Get-CsrfHeader $developerSession) | Out-Null } catch { Write-Warning "Developer cleanup failed: $($_.Exception.Message)" }
    }
}
