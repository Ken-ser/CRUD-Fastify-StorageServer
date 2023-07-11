# CRUD-Fastify-StorageServer
Server di storage con **API CRUD** e sistema di autenticazione **JWT** utilizzando **Node.js** e il framework **Fastify**

### **Sign-up e Sign-in**

Gli utenti si possono registrare con e-mail e password.

Il server unisce la password ad un "salt" (valore randomico), calcola il digest dell'unione con un algoritmo di hash (es. SHA256) e lo salva, insieme al salt, in un file JSON ([**users.json**](#struttura-del-file-usersjson)). 

In fase di login viene confrontato l'hash della password inviata dal client e l’hash salvato nel DB in modo da verificare la correttezza della password.

Se il login ha successo viene restituito un [**JWT**](#struttura-del-jwt).

### **Storage**

I dati che il client invia sono stringhe codificate in base64 associate a chiavi che le identificano.

Il server salva i dati inviati dal client in un file JSON ([**data.json**](#struttura-del-file-datajson)) sul proprio file system e autorizza gli utenti attraverso un JWT.

Ogni utente può accedere solo ai dati caricati da lui stesso.

Esiste un utente con poteri di **superuser** ("su" role), in grado di poter accedere e modificare i dati di tutti gli altri utenti ("u" role). Per gestire questa casistica viene sfruttato il JWT per includere un **ruolo** (parametro "role" nel payload del [**JWT**](#struttura-del-jwt)).

Quando un utente elimina il proprio account vengono eliminati anche i dati caricati dallo stesso presenti nel DB ([**data.json**](#struttura-del-file-datajson)).

### **Struttura del file users.json:**

| Username | Password | role |
| --- | --- | --- |
| user1@mail.com | User101- | u |
| admin@mail.com | Admin01- | su |

```json
[
    {
        "email": "user1@mail.com",
        "password": "c312ccd3e1481fc87c582e3bfb61a751ad765",
        "salt": "eb384d6d42520592a81e73",
        "role": "u"
    },
    {
        "email": "admin@mail.com",
        "password": "d7a65b19ca8c4da9f7518621cec4365c27ecb",
        "salt": "06c6ff9c6264498e37e7a1",
        "role": "su"
    }
]
```

### **Struttura del file data.json:**
```json
[
    {
        "key": "user1.txt",
        "data": "data",
        "owner": "user1@mail.com"
    },
    {
        "key": "admin.txt",
        "data": "data",
        "owner": "admin@mail.com"
    }
]
```

### **Struttura del JWT:**
<sub>Token (example)</sub>
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImFkbWluQG1haWwuY29tIiwicm9sZSI6InN1IiwiaWF0IjoxNjg4OTgwODgxLCJleHAiOjE2ODg5ODgwODF9.Od0sCaP9hSzQ4LZAsU8EPFZmu3Eq8FAXDF7DFxYwIts

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
    "email": "admin@mail.com",
    "role": "su",
    "iat": 1688980881,
    "exp": 1688988081
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
    | *DELETE | /delete | _Elimina l’utente legato al JWT inviato al server_ |

    <sub>HTTP header</sub>
    ```
    Authorization: Bearer <token>
    ```

- | Method | Path | Description |
    | --- | --- | --- |
    | *POST | /data | _Carica dei dati nuovi_ |

    <sub>Request body</sub>
    ```json
    { 
        "key": "esempio.txt",
        "data": "SXMgdGhpcyBhIEpvSm8gsKVmZXJlbmNlPw=="
    }
    ```

- | Method | Path | Description |
    | --- | --- | --- |
    | *GET | /data/:key | _Ritorna i dati corrispondenti alla chiave_ |

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
    | *PATCH | /data/:key | _Aggiorna i dati corrispondenti alla chiave_ |

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
    | *DELETE | /data/:key | _Elimina i dati corrispondenti alla chiave_ |

&emsp;<sub>(Il simbolo * indica che l’API è protetta)</sub>

### **Plugin impiegati**:
- fastify-plugin
- fastify-autoload 
- fluent-json-schema
- jsonwebtoken
- node-forge
- fs/promises

### **Come avviare il server**
1. Scaricare il progetto tramite [**Git**](https://git-scm.com/) o tramite l'interfaccia di GitHub
2. Installare [**Node.js**](https://nodejs.org/en/download)
3. Aprire un terminale nella cartella del progetto (CRUD-Fastify-StorageServer-main)
4. (opzionale) Installare [**nodemon**](https://nodemon.io/): permette di riavviare il server automaticamente ogni volta che il codice viene modificato
5. Installare il modulo fastify: `npm install fastify`
6. Avviare il server
   - Tramite nodemon: `nodemon .\server.js`
   - Tramite Node.js: `node .\server.js`