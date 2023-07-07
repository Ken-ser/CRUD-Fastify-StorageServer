# CRUD-Fastify-StorageServer
Server di storage con **API CRUD** e sistema di autenticazione **JWT** utilizzando **Node.js** e il framework **Fastify**

### **Sign-up e Sign-in**

Gli utenti si possono registrare con e-mail e password.

Il server unisce la password ad un "salt" (valore randomico), calcola il digest dell'unione con un algoritmo di hash (es. SHA256) e lo salva, insieme al salt, in un file JSON ([**users.json**](#struttura-del-file-usersjson)). 

In fase di login viene confrontato l'hash della password passata dal client e l’hash salvato in modo da verificare la correttezza della password.

Se il login ha successo viene restituito un [**JWT**](#struttura-del-jwt).

### **Storage**

I dati che il client invia sono stringhe codificate in base64 associate a chiavi che le identificano.

Il server salva i dati inviati dal client in un file JSON ([**data.json**](#struttura-del-file-datajson)) sul proprio file system e autorizza gli utenti attraverso un JWT.

Ogni utente può accedere solo ai dati caricati da lui stesso.

Esiste un utente con poteri di **superuser**, in grado di poter accedere e modificare i dati di tutti gli altri utenti. Per gestire questa casistica viene sfruttato il JWT per includere un **ruolo** (parametro "role" nel payload del [**JWT**](#struttura-del-jwt)).

### **Struttura del file users.json:**
```json
[
    {
        "email": "example@gmail.com",
        "password": "c79d74c3476e096c2495c538c4dc5302b81",
        "salt": "7587646c2b73",
        "role": "u"
    },
    {
        "email": "admin",
        "password": "7a1d0a78b9f08b8b70b1196f56e0d73e3af",
        "salt": "285673ee4558",
        "role": "su"
    }
]
```

### **Struttura del file data.json:**
```json
[
    {
        "key": "text.txt",
        "data": "data",
        "owner": "example@gmail.com"
    },
    {
        "key": "...",
        "data": "...",
        "owner": "..." 
    }
]
```

### **Struttura del JWT:**
<sub>Token (example)</sub>
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImV4YW1wbGVAZ21haWwuY29tIiwicm9sZSI6InUiLCJpYXQiOjE2ODg1ODMxNjEsImV4cCI6MTY4ODU4Njc2MX0.64iYFRZA2QHGVQx-gKAJWYSDVzYBvY8FZvQt1KW9CXY

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

### **Endpoint principali:**

- | Method | Path | Description |
    | --- | --- | --- |
    | POST | /register | _Registra un nuovo utente_ |

    <sub>Request body</sub>
    ```json
    {
        "email": "example@gmail.com",
        "password": "password"
    }
    ```

- | Method | Path | Description |
    | --- | --- | --- |
    | POST | /login | _Effettua login e riceve in risposta il JWT_ |

    <sub>Request body</sub>
    ```json
    {
        "email": "example@gmail.com",
        "password": "password"
    }
    ```

    <sub>Response body</sub>
    ```json
    {
        "info": "Signed in",
        "access_token": "...",
        "token_type": "JWT",
        "expires_in": "1h"
    }
    ```

- | Method | Path | Description |
    | --- | --- | --- |
    | DELETE | /delete | _Elimina l’utente legato al JWT inviato al server_ |

    <sub>HTTP header</sub>
    ```
    Authorization: Bearer <token>
    ```

- | Method | Path | Description |
    | --- | --- | --- |
    | POST | /data | _Carica dei dati nuovi_ |

    <sub>Request body</sub>
    ```json
    { 
        "key": "esempio.txt",
        "data": "SXMgdGhpcyBhIEpvSm8gsKVmZXJlbmNlPw=="
    }
    ```

- | Method | Path | Description |
    | --- | --- | --- |
    | GET | /data/:key | _Ritorna i dati corrispondenti alla chiave_ |

    <sub>Response body</sub>
    ```json
    {
        "info": "Data found",
        "key": "text.txt",
        "data": "data"
    }
    ```

- | Method | Path | Description |
    | --- | --- | --- |
    | PATCH | /data/:key | _Aggiorna i dati corrispondenti alla chiave_ |

    <sub>Request body</sub>
    ```json
    { 
        "data": "Y2hhbmdlZA=="
    }
    ```
    <sub>Response body</sub>
    ```json
    {
        "info": "Data patched",
        "key": "text.txt",
        "data": "Y2hhbmdlZA=="
    }
    ```
    
- | Method | Path | Description |
    | --- | --- | --- |
    | DELETE | /data/:key | _Elimina i dati corrispondenti alla chiave_ |

&emsp;<sub>(Il simbolo * indica che l’API è protetta)</sub>

### **Plugin impiegati**:
- fastify-plugin
- fastify-autoload 
- fluent-json-schema
- jsonwebtoken
- node-forge


