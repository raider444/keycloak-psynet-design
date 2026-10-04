<#import "template.ftl" as layout>
<@layout.emailLayout>
${kcSanitize(msg("passwordResetBodyHtml",link, linkExpiration, realmName, linkExpirationFormatter(linkExpiration)))?replace('<a ', '<a style="color:@ACCENT@;text-decoration:underline;" ')?no_esc}
</@layout.emailLayout>
