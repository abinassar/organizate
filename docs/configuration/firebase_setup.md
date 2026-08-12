# Guía de Configuración de Firebase desde la Línea de Comandos (CLI)

Esta guía describe el paso a paso detallado para instalar Firebase CLI, autenticarse, inicializar un proyecto y aprovisionar/desplegar una base de datos de Firebase (Cloud Firestore o Realtime Database) utilizando la terminal.

---

## Requisitos Previos

Asegúrate de tener instalado:
* [Node.js](https://nodejs.org/) (incluye `npm`).
* Una cuenta de Google activa para acceder a Firebase.

---

## Paso 1: Instalar Firebase CLI

Para interactuar con Firebase desde la línea de comandos, primero debes instalar las herramientas de Firebase (`firebase-tools`) globalmente en tu sistema.

Abre tu terminal y ejecuta:

```bash
npm install -g firebase-tools
```

> [!TIP]
> Si estás en Windows y tienes problemas de permisos, ejecuta la terminal de PowerShell como Administrador.

Para verificar que la instalación fue exitosa, puedes comprobar la versión:

```bash
firebase --version
```

---

## Paso 2: Autenticación en Firebase

Debes conectar la interfaz de comandos con tu cuenta de Google.

Ejecuta el siguiente comando:

```bash
firebase login
```

1. Este comando abrirá una ventana en tu navegador web predeterminado.
2. Selecciona la cuenta de Google asociada a tu consola de Firebase.
3. Concede los permisos necesarios a Firebase CLI.
4. Una vez completado, verás un mensaje de éxito en la terminal: `✔  Success! Logged in as user@domain.com`.

---

## Paso 3: Crear un Proyecto de Firebase (Opcional)

Si aún no tienes un proyecto creado en Firebase Console, puedes crearlo directamente desde la línea de comandos.

```bash
firebase projects:create nombre-proyecto-unico --display-name "Mi Aplicacion PWA"
```

* **`nombre-proyecto-unico`**: El identificador único global del proyecto (letras minúsculas, números y guiones).
* **`--display-name`**: Nombre visible de tu proyecto en la consola de Firebase.

---

## Paso 4: Inicializar Firebase en tu Proyecto Local

Dirígete a la raíz de tu proyecto Ionic/Angular y corre el comando de inicialización:

```bash
firebase init
```

Esto abrirá un menú interactivo en tu terminal. Sigue estos pasos para configurarlo:

1. **Seleccionar Características**: Usa la barra espaciadora para seleccionar las características necesarias. Para una base de datos con capacidades offline, se recomienda **Firestore** o **Realtime Database**:
   * `(*) Firestore: Configure security rules and indexes files for Firestore`
   * Y opcionalmente si deseas hosting para tu PWA: `(*) Hosting: Configure files for Firebase Hosting...`
   * Presiona **Enter** para confirmar.

2. **Asociación de Proyecto**:
   * Selecciona `Use an existing project` (Usar un proyecto existente).
   * Elige el proyecto que creaste en el **Paso 3** (o el proyecto que ya tengas en tu consola).

3. **Configuración de Archivos (Firestore)**:
   * **Rules File**: Presiona **Enter** para aceptar el nombre por defecto (`firestore.rules`).
   * **Indexes File**: Presiona **Enter** para aceptar el nombre por defecto (`firestore.indexes.json`).

---

## Paso 5: Crear e Inicializar la Base de Datos

### Opción A: Cloud Firestore (Recomendado para PWAs)

Para habilitar la base de datos de Cloud Firestore en tu proyecto, puedes crear la base de datos por defecto desde la línea de comandos usando Google Cloud SDK (`gcloud`) o directamente desplegando las reglas de Firebase que inicializan el servicio.

1. **Creación de la Instancia de la Base de Datos (a través del CLI de gcloud)**:
   Si tienes instalado `gcloud CLI`, puedes crear la base de datos de Firestore en tu proyecto con:
   ```bash
   gcloud firestore databases create --project="TU_PROJECT_ID" --region="us-east1" --type=firestore-native
   ```
   *(Reemplaza `TU_PROJECT_ID` con tu ID de proyecto y la región preferida).*

2. **Crear base de datos desde Firebase Console (Alternativa rápida)**:
   Alternativamente, puedes entrar a [Firebase Console](https://console.firebase.google.com/), seleccionar tu proyecto, ir a **Firestore Database** y hacer clic en **Crear base de datos**.

3. **Desplegar Reglas de Seguridad locales**:
   Edita el archivo `firestore.rules` creado en la raíz de tu proyecto para definir las reglas de lectura/escritura (para desarrollo puedes permitir todo, pero recuerda restringirlo antes de producción):
   
   ```javascript
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /{document=**} {
         allow read, write: if true; // Habilitado para pruebas iniciales
       }
     }
   }
   ```
   
   Luego, despliega las reglas de seguridad:
   ```bash
   firebase deploy --only firestore:rules
   ```

### Opción B: Realtime Database (Alternativa)

Si seleccionaste Realtime Database durante `firebase init`:

1. El comando habrá creado un archivo `database.rules.json` en la raíz.
2. Despliega las reglas de la base de datos en tiempo real:
   ```bash
   firebase deploy --only database
   ```

---

## Paso 6: Obtener la Configuración del SDK (Credenciales)

Para conectar tu aplicación Ionic con la base de datos de Firebase, necesitas obtener las claves de acceso de tu aplicación web. Puedes obtenerlas directamente desde el CLI con:

```bash
firebase apps:sdkconfig web
```

Este comando te devolverá un objeto JSON similar a este:

```json
{
  "apiKey": "AIzaSyA1...",
  "authDomain": "proyecto.firebaseapp.com",
  "projectId": "proyecto",
  "storageBucket": "proyecto.appspot.com",
  "messagingSenderId": "123456789",
  "appId": "1:123456789:web:abcd1234efgh"
}
```

Copia estas claves y colócalas en los archivos de entorno de tu aplicación Angular (`environment.ts` y `environment.prod.ts`) como se describe en la implementación de la aplicación.

---

## Solución de Problemas (Troubleshooting)

### Error: `Could not load dependency vite in ./, have you run npm install?`

**Problema:**
En las versiones recientes de Firebase CLI, la funcionalidad experimental de detección y compilación automática de frameworks web (`webframeworks`) está activada. Al detectar ciertas configuraciones, el CLI intenta buscar `vite` como dependencia local para compilar el proyecto. Al ser un proyecto Angular e Ionic convencional, la inicialización falla inesperadamente con este error.

**Solución 1: Deshabilitar el experimento de Frameworks Web en el CLI (Recomendado)**
Puedes apagar este experimento global de Firebase Tools ejecutando:

```bash
firebase experiments:disable webframeworks
```

Una vez desactivado, ejecuta nuevamente la inicialización para configurar Hosting normalmente:

```bash
firebase init hosting
```

**Solución 2: Configuración Manual (Evitando el asistente del CLI)**
Dado que una PWA de Ionic/Angular se compila como un sitio estático en la carpeta `www`, puedes omitir la inicialización interactiva creando los archivos de configuración manualmente en la raíz del proyecto. 

*(Nota: Ya hemos generado estos archivos automáticamente en tu espacio de trabajo para corregir el error actual)*.

* **[firebase.json](file:///c:/Users/abina/OneDrive/Documentos/04.Personal/01.Projects/Organizate/firebase.json)**: Configura las reglas de Firestore y apunta el Hosting a la carpeta `www` con redirección de rutas de Angular.
* **[.firebaserc](file:///c:/Users/abina/OneDrive/Documentos/04.Personal/01.Projects/Organizate/.firebaserc)**: Vincula tu carpeta local con tu ID de proyecto de Firebase (`organizate-abinassar`).

