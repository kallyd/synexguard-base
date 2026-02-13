# Guia de Segurança

## Controles implementados na base

- JWT para autenticação de API
- Middleware de rate limit por IP
- RBAC inicial por permissões
- Logging estruturado para auditoria
- mTLS preparado no agente para comunicação com API
- Campos de auditoria em banco

## Próximos hardenings recomendados

- Rotação de chaves JWT e certificados mTLS
- WAF na borda da API
- Segredos em cofre (Vault/KMS)
- Assinatura e verificação de atualização do agente
- Tracing distribuído e SIEM ingestion completo
