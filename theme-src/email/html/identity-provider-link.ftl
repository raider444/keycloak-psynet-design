<#import "template.ftl" as layout>
<@layout.emailLayout>
${kcSanitize(msg("identityProviderLinkBodyHtml", identityProviderDisplayName, realmName, identityProviderContext.username, link, linkExpiration, linkExpirationFormatter(linkExpiration)))?replace('<a ', '<a style="color:@ACCENT@;text-decoration:underline;" ')?no_esc}
</@layout.emailLayout>
