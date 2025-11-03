+++
author = 'Ash'
title = 'Compromised Salesforce Marketing Cloud Used to Send Phishing Emails to Bypass Spam Filters'
description = 'In this post, we will go over a phishing email I received on 1 November 2025 and how they used compromised Salesforce Marketing Cloud accounts to bypass spam filters.'
date = '2025-11-02T13:36:42-05:00'
draft = false
tags = [
    'Salesforce',
    'Phishing',
    'SaaS',
    'DMARC',
    'Email Security',
    'Cybercrime',
]
+++

Most people have received a phishing email at some point in their lives. Some are easy to spot, while others can fool even seasoned security professionals. Email filters have advanced a lot in the last decade and with the help of AI, many people rarely see spam and phishing emails anywhere outside of their junk directory.

However, attackers are still finding creative ways to bypass these filters so that you are more likely to interact with their specially crafted emails.

## The Email

On November 1, 2025, I received an email to my personal Outlook inbox. The subject was "Claim your Reward:" from "AsterdexTeam" which is a cryptocurrency platform.

#### Email Body:
![Phishing email screenshot](/images/compromised-salesforce-cloud-used-to-send-phishing-emails-to-bypass-spam-filters/2fec45c805d861009f136a32eef11a65.png)

## Sender

Upon closer inspection, I noticed that the email came from `biolife.donor.response@email-biolifeplasma[.]com`. This stood out because most phishing emails I receive use spoofed domains that resemble the service they're impersonating. This was unusual since the email claimed to be from Asterdex, not BioLifePlasma.

I ran a WHOIS lookup on `email-biolifeplasma[.]com`, expecting it to be a newly created domain. Surprisingly, it has been registered for over a decade, with Salesforce.com, Inc. listed as administrative contact. I began looking into the email headers, starting with the authentication header which showed that it passed SPF, DKIM, and DMARC validations for the `email-biolifeplasma[.]com` and `s1.y.mc.salesforce.com` domains. The message came from a server Salesforce controls rather than a random mail server, making it far more convincing to automated filters. This indicates the email originated from a legitimate Salesforce Marketing Cloud account belonging to BioLifePlasma.

I then examined the link in the message body: `https://click.email-biolifeplasma[.]com/?qs=24e1e18630a14f3742c2fde...`. My understanding is that Salesforce allows you to create tracked links for analytics purposes. When visiting the link, it redirects me to a new domain `access-asterdex[.]com`. This is the domain to the actual phishing page that the user lands on. The attackers are taking advantage of Salesforce tracking links in order to hide the malicious destination and bypass spam filters that would otherwise block known phishing domains.

Next, I wanted to understand exactly how the redirect worked.

## Link Flow

I used Burp Suite to track what requests were being made when visiting the provided link. This is the result of the first request made when following the link:
```http
HTTP/1.1 302 Found
Cache-Control: private
Content-Type: text/html; charset=utf-8
Location: https://access-asterdex.com/?userid=xB8zT1Lm9qXk...&sfmc_id=318...
Date: Sun, 02 Nov 2025 19:35:54 GMT
Connection: close
Content-Length: 219

<html><head><title>Object moved</title></head><body>
<h2>Object moved to <a href="https://access-asterdex.com/?userid=xB8zT1Lm9qXk...&amp;sfmc_id=318...">here</a>.</h2>
</body></html>
```
The `302 Found` response redirects to the phishing URL, including parameters such as `userid` and `sfmc_id`. I assume the `sfmc_id` parameter is the Salesforce Marketing Cloud ID.

After being redirected to the new URL, we get the following response:

```http
HTTP/2 302 Found
Server: nginx
Date: Sun, 02 Nov 2025 19:36:00 GMT
Content-Type: text/html; charset=UTF-8
Content-Length: 0
X-Powered-By: PHP/8.4.14
Expires: Thu, 19 Nov 1981 08:52:00 GMT
Cache-Control: no-store, no-cache, must-revalidate
Pragma: no-cache
Set-Cookie: PHPSESSID=00a1601548e77d9bf92087a7d65d5396; path=/
Location: /claim/
X-Powered-By: PleskLin
```

If you try to visit `access-asterdex[.]com/claim/` directly, the page fails to load because a session is required, which is only set through the redirect. This makes it harder for crawlers and researchers to investigate the site by accessing the URL directly.

After setting the session, it then redirects us to `access-asterdex[.]com/claim/`. This is where the actual phishing page is located.

#### Actual Phishing Page:

![Phishing page screenshot](/images/compromised-salesforce-cloud-used-to-send-phishing-emails-to-bypass-spam-filters/25ad0d9b4eaa2e1cfa16609e87370277.png)

![Phishing page connect screenshot](/images/compromised-salesforce-cloud-used-to-send-phishing-emails-to-bypass-spam-filters/fc4423ee5a3e5f110ed0133f6ed24e81.png)

While this page loads, there are other interesting requests being made in the background.

#### Request:
```http
GET / HTTP/1.1
Host: api.ipify.org
Sec-Ch-Ua-Platform: "Linux"
Accept-Language: en-US,en;q=0.9
Sec-Ch-Ua: "Chromium";v="141", "Not?A_Brand";v="8"
User-Agent: Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36
Sec-Ch-Ua-Mobile: ?0
Accept: */*
Origin: https://access-asterdex.com
Sec-Fetch-Site: cross-site
Sec-Fetch-Mode: cors
Sec-Fetch-Dest: empty
Referer: https://access-asterdex.com/
Accept-Encoding: gzip, deflate, br
Priority: u=1, i
Connection: keep-alive
```

#### Response:
```http
HTTP/2 200 OK
Date: Sun, 02 Nov 2025 19:36:13 GMT
Content-Type: text/plain
Server: cloudflare
Access-Control-Allow-Origin: *
Vary: Origin
Cf-Cache-Status: DYNAMIC
Cf-Ray: 9986145ab9caebba-YYZ

62.93.xxx.xxx
```

The phishing site queries `api.ipify.org` to capture the client’s public IP address, likely as part of victim fingerprinting or anti-analysis.

The page prompts users to connect their crypto wallets (e.g., MetaMask, WalletConnect, etc.). Once connected, the attackers will have access to the wallet and will transfer the funds to their own wallets.

## Hosting

Pinging the URL gives us the IPv4 address `91.215.85.170`. This appears to be from a Russian hosting provider.

#### RIPE query:
```r
inetnum:        91.215.85.0 - 91.215.85.255
netname:        RU-PROSPERO
country:        RU
org:            ORG-PO83-RIPE
admin-c:        ND7667-RIPE
tech-c:         ND7667-RIPE
status:         ASSIGNED PI
mnt-by:         PROSPERO-MNT
mnt-by:         RIPE-NCC-END-MNT
created:        2022-12-08T14:50:40Z
last-modified:  2023-12-16T19:11:14Z
source:         RIPE
```

Hosting phishing pages on Russian infrastructure is common since takedowns and investigations are more difficult. Russia-based hosting providers are not likely to cooperate with foreign takedown requests or investigations. Once a domain is marked as a phishing page by services like Google Safe Browsing, they can easily rotate to a new domain without having to also rotate hosting providers.

## URL Scan

Running the phishing domain through a URL scanner revealed the domain `click.correo.verti.es` being contacted. When looking into the IP this domain points to, I noticed that it is also a Salesforce IP. This is most likely the same type of tracking link that was used in the phishing email I received. When looking into the `verti.es` website, it appears to be a Spain-based insurance provider.

This suggests that multiple Salesforce Marketing Cloud customer accounts may have been compromised and abused in similar campaigns.

# Recommendations

Email authentication standards like SPF, DKIM, and DMARC are powerful tools, but they cannot fully protect against phishing when a legitimate sender domain has been compromised. Users should go beyond trusting these validations and examine whether the sender address and message content make sense together.

In this case, the email claimed to be from a cryptocurrency platform but originated from a domain belonging to a healthcare company. That mismatch alone is a major red flag. Other suspicious signs include unsolicited offers, requests to connect crypto wallets, or being asked to log in to unfamiliar services.

As email filtering and AI-based detection improve, adversaries will continue finding ways to exploit trusted cloud services and infrastructure. Always treat unexpected messages with a degree of skepticism:

- Verify sender details and domain context before interacting.
- Hover over links to inspect the final destination before clicking.
- Access accounts or wallets directly through bookmarked or known URLs rather than links in messages.
- Never connect a crypto wallet or sign transactions prompted by unsolicited emails.

## For Businesses Using Salesforce or Similar Platforms

Attackers are increasingly targeting SaaS marketing tools because these systems have built-in domain trust and global reach. Compromising a single tenant can give criminals access to powerful email infrastructure that easily bypasses filters.

To reduce risk:
- Enforce strong MFA (preferably hardware-key based) for all Salesforce accounts.
- Audit and rotate API keys regularly, and monitor for unusual API or SMTP activity.
- Restrict send permissions and integrate outbound mail logging with your SIEM for anomaly detection.
- Implement least privilege principles. Marketing users don't need administrative access.
- Establish a phishing abuse response plan for compromised credentials or integrations.

# Conclusion

This campaign demonstrates how attackers can abuse trusted SaaS ecosystems, in this case, Salesforce Marketing Cloud, to distribute phishing messages that appear fully authenticated and legitimate.

As organizations increasingly depend on third-party marketing platforms, securing those accounts is just as critical as securing your organization's internal mail infrastructure.

Ultimately, both users and businesses must adopt a layered mindset: **trust but verify, validate but question, and always scrutinize before you click**.
