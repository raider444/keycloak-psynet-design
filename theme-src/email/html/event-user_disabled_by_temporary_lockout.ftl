<#import "template.ftl" as layout>
<@layout.emailLayout>
${kcSanitize(msg("eventUserDisabledByTemporaryLockoutHtml", event.date))?replace('<a ', '<a style="color:@ACCENT@;text-decoration:underline;" ')?no_esc}
</@layout.emailLayout>
