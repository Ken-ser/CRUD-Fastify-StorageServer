# CRUD-Fastify-StorageServer
## Server di storage con API CRUD e sistema di login JWT utilizzando Node.js e il framework Fastify
Il server salva i dati inviati dal client in un file JSON sul file system e autenticare gli utenti attraverso un token JWT.

Gli utenti si possono registrare con e-mail e password, le password vengono salvate dal server in un JSON dopo essere state “hashate” (ad esempio con SHA256). 

In fase di login vengono confrontati gli hash della password passata dal client e l’hash salvato in modo da verificare la correttezza della password.

I dati che il client invia sono stringhe codificate in base64 alla quale viene associata una chiave, per esempio il body della chiamata POST /data sarà:

{ key: “esempio.txt”, data: “SXMgdGhpcyBhIEpvSm8gsKVmZXJlbmNlPw==” }

I dati (JSON) inviati dal client verranno validati con un JSON Schema tramite Fastify.

Vengono gestiti gli errori, un client riceve un errore 403 se chiama una API protetta senza essere loggato, mentre se prova a fare una GET di una chiave (file) che non esiste riceve un 404.

Esiste un utente con poteri di superuser, in grado di poter accedere e modificare i dati di tutti gli altri utenti. Per gestire questa casistica sfrutterò il JWT per includere dei dati aggiuntivi, come in questo caso un “ruolo”.

**Endpoint principali** (Il simbolo * indica che l’API è protetta.):
- User
    - POST /register
    
        _Registra un nuovo utente_
    - POST /login
    
        _Effettua login e riceve in risposta il JWT_
    - *DELETE /delete
    
        _Elimina l’utente attualmente loggato_
- Data
    - *POST /data
    
        _Carica dei dati nuovi_
    - *GET /data/:key
    
        _Ritorna i dati corrispondenti alla chiave_
    - *PATCH /data/:key
    
        _Aggiorna i dati corrispondenti alla chiave_
    - *DELETE /data/:key
    
        _Elimina i dati corrispondenti alla chiave_	

**Plugin necessari**:
- fluent-json-schema
- fastify-plugin
- fastify-jwt
- fastify-autoload 


