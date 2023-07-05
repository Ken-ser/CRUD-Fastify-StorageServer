# CRUD-Fastify-StorageServer
Server di storage con **API CRUD** e sistema di autenticazione **JWT** utilizzando **Node.js** e il framework **Fastify**

### **Sign-up e Sign-in**

Gli utenti si possono registrare con e-mail e password.

Le password vengono salvate dal server in un file JSON ([**users.json**](#struttura-del-file-usersjson)) dopo essere state “hashate” (ad esempio con SHA256). 

In fase di login vengono confrontati gli hash della password passata dal client e l’hash salvato in modo da verificare la correttezza della password.

Se il login ha successo viene restituito un JWT.

### **Storage**

I dati che il client invia sono stringhe codificate in base64 associate a chiavi che le identificano.

Il server salva i dati inviati dal client in un file JSON ([**data.json**](#struttura-del-file-datajson)) sul proprio file system e autentica gli utenti attraverso un **token JWT**.

Ogni utente può accedere solo ai dati caricati da lui stesso.

Esiste un utente con poteri di **superuser**, in grado di poter accedere e modificare i dati di tutti gli altri utenti. Per gestire questa casistica sfrutterò il JWT per includere dei dati aggiuntivi, come in questo caso un **ruolo**.

### **Struttura del file users.json:**
```json
[
    {
        "email": "example@gmail.com",
        "password": "password"
    }
]
```

### **Struttura del file data.json:**
```json
[
    {
        "owner": "example@gmail.com",
        "files": [
            {
                "key": "text.txt",
                "data": "changed"
            }
        ]
    },
    {
        "owner": "...",
        "files": [...]
    } 
]
```

### **Endpoint principali** (Il simbolo * indica che l’API è protetta):
- User
    - POST /register
        ```javascript
        //Request body:
        {
            "email": "example@gmail.com",
            "password": "password"
        }
        ```

        _Registra un nuovo utente_
    - POST /login
        ```javascript
        //Request body
        {
            "email": "example@gmail.com",
            "password": "password"
        }
        ```
        _Effettua login e riceve in risposta il JWT_
    - *DELETE /delete
        ```
        //HTTP Header
        Authorization: Bearer <token>
        ```
    
        _Elimina l’utente legato al JWT fornito al server_
- Data
    - *POST /data

        ```javascript
        //Request body
        { 
            "key": "esempio.txt",
            "data": "SXMgdGhpcyBhIEpvSm8gsKVmZXJlbmNlPw=="
        }
        ```

        _Carica dei dati nuovi_
    - *GET /data/:key
    
        _Ritorna i dati corrispondenti alla chiave_
    - *PATCH /data/:key
    
        _Aggiorna i dati corrispondenti alla chiave_
    - *DELETE /data/:key
    
        _Elimina i dati corrispondenti alla chiave_	

### **Plugin impiegati**:
- fluent-json-schema
- fastify-plugin
- jsonwebtoken
- fastify-autoload 


