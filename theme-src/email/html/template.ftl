<#macro emailLayout>
<!DOCTYPE html>
<html lang="${locale!"en"}" dir="${(ltr!true)?then('ltr','rtl')}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="@SCHEME@">
  <meta name="supported-color-schemes" content="@SCHEME@">
  <title>PsyNet</title>
  <style>
    @font-face{font-family:'PsyNet Circuit';src:url('${url.resourcesUrl}/PsyNet-Circuit.woff2') format('woff2')}
    body,table,td{margin:0;padding:0}a{color:@ACCENT@}p{margin:0 0 18px}
    @media only screen and (max-width:620px){.psy-email-content{padding:24px 18px!important}.psy-email-shell{width:100%!important}}
  </style>
</head>
<body bgcolor="@BACKGROUND@" style="margin:0;padding:0;background-color:@BACKGROUND@;color:@TEXT@;font-family:Arial,Helvetica,sans-serif;-webkit-text-size-adjust:100%;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="@BACKGROUND@" style="width:100%;background-color:@BACKGROUND@;">
    <tr><td align="center" style="padding:24px 12px;">
      <!--[if mso]><table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0"><tr><td><![endif]-->
      <table role="presentation" class="psy-email-shell" width="600" cellpadding="0" cellspacing="0" border="0" bgcolor="@SURFACE@" style="width:100%;max-width:600px;background-color:@SURFACE@;border:1px solid @LINE@;">
        <tr><td align="center" bgcolor="#0b1523" style="padding:24px;background-color:#0b1523;border-bottom:3px solid #80e7df;">
          <img src="${url.resourcesUrl}/psynet-logo.png" width="240" height="80" alt="PsyNet" style="display:block;width:240px;max-width:100%;height:auto;border:0;color:#ffffff;font:32px 'PsyNet Circuit',Arial,sans-serif;">
        </td></tr>
        <tr><td class="psy-email-content" style="padding:32px;color:@TEXT@;font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:1.65;overflow-wrap:anywhere;word-break:break-word;">
          <#-- Native bodies preserve localized security text, URLs, and expiry. -->
          <#nested>
        </td></tr>
        <tr><td style="padding:18px 24px;border-top:1px solid @LINE@;color:@MUTED@;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.6;text-align:center;">
          <span style="font-family:'PsyNet Circuit',Arial,sans-serif;">PsyNet</span> &middot; ${realmName}
        </td></tr>
      </table>
      <!--[if mso]></td></tr></table><![endif]-->
    </td></tr>
  </table>
</body>
</html>
</#macro>
