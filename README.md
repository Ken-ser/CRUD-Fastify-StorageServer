# CRUD-Fastify-StorageServer
Server di storage con **API CRUD** e sistema di autenticazione **JWT** utilizzando **Node.js** e il framework **Fastify**

### **Sign-up e Sign-in**

Gli utenti si possono registrare con e-mail e password.

Le password vengono salvate dal server in un file JSON ([**users.json**](#struttura-del-file-usersjson)) dopo essere state “hashate” (ad esempio con SHA256). 

In fase di login vengono confrontati gli hash della password passata dal client e l’hash salvato in modo da verificare la correttezza della password.

Se il login ha successo viene restituito un [**JWT**](#struttura-del-jwt).

### **Storage**

I dati che il client invia sono stringhe codificate in base64 associate a chiavi che le identificano.

Il server salva i dati inviati dal client in un file JSON ([**data.json**](#struttura-del-file-datajson)) sul proprio file system e autentica gli utenti attraverso un JWT.

Ogni utente può accedere solo ai dati caricati da lui stesso.

Esiste un utente con poteri di **superuser**, in grado di poter accedere e modificare i dati di tutti gli altri utenti. Per gestire questa casistica viene sfruttato il JWT per includere un **ruolo** (parametro "role" nel payload del JWT).

### **Struttura del file users.json:**
```json
[
    {
        "email": "example@gmail.com",
        "password": "password",
        "role": "u"
    },
    {
        "email": "admin",
        "password": "admin",
        "role": "su"
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
        "files": []
    } 
]
```

### **Struttura del JWT:**
<sub>Header</sub>
```json
{
    "alg": "HS256",
    "typ": "JWT"
}
```
<sub>Payload</sub>
```json
{
    "email": "example@gmail.com",
    "role": "u",
    "iat": 1688583161,
    "exp": 1688586761
}
```
<sub>Signature</sub>
```js
HMACSHA256(
    base64UrlEncode(header) + "." +
    base64UrlEncode(payload),
    secret
)
```

### **Endpoint principali:** &emsp;<sub>(Il simbolo * indica che l’API è protetta)</sub>
- User
    - POST /register&emsp;

        _Registra un nuovo utente_

        <sub>Request body</sub>
        ```json
        {
            "email": "example@gmail.com",
            "password": "password"
        }
        ```

    - POST /login
        
        _Effettua login e riceve in risposta il JWT_

        <sub>Request body</sub>
        ```json
        {
            "email": "example@gmail.com",
            "password": "password"
        }
        ```
    - *DELETE /delete
        
        _Elimina l’utente legato al JWT inviato al server_

        <sub>HTTP header</sub>
        ```
        Authorization: Bearer <token>
        ```

    
- Data
    - *POST /data
        
        _Carica dei dati nuovi_

        <sub>Request body</sub>

        ```json
        { 
            "key": "esempio.txt",
            "data": "SXMgdGhpcyBhIEpvSm8gsKVmZXJlbmNlPw=="
        }
        ```

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


