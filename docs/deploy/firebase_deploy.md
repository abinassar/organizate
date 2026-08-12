# Guía de Despliegue en Firebase Hosting

Esta guía detalla los comandos, flujos de trabajo y configuraciones necesarias para compilar y desplegar tu PWA de Ionic/Angular en los servidores de Firebase Hosting.

---

## Requisitos Previos

Antes de realizar cualquier despliegue, asegúrate de:
1. Haber iniciado sesión en la terminal:
   ```bash
   firebase login
   ```
2. Tener configurado el proyecto por defecto en tu archivo `.firebaserc` (o seleccionar uno activo usando `firebase use default`).

---

## Flujo de Despliegue Estándar

El proceso de despliegue consta de dos pasos principales: compilar los archivos de producción locales y subirlos a los servidores de Firebase.

### Paso 1: Compilar la Aplicación
Genera los archivos estáticos de producción optimizados en el directorio `www/`.

```bash
npm run build
```

> [!NOTE]
> Este comando ejecuta internamente `ng build`, aplicando optimizaciones de código, minificación de scripts y reemplazo de variables de entorno para producción (`environment.prod.ts`).

### Paso 2: Ejecutar el Despliegue
Envía el compilado y las reglas de bases de datos locales a Firebase.

```bash
firebase deploy
```

Al finalizar, la terminal te proporcionará la URL pública del proyecto (ej: `https://organizate-abinassar.web.app`).

---

## Despliegues Parciales (Filtros)

Si solo has realizado cambios en una sección específica de tu proyecto, no es necesario volver a subir todo. Puedes usar flags para limitar el despliegue:

### 1. Desplegar solo la PWA (Hosting)
Sube únicamente los archivos estáticos de la carpeta `www/` (HTML, JS, CSS, imágenes):
```bash
firebase deploy --only hosting
```

### 2. Desplegar solo Bases de Datos (Firestore)
* **Reglas de seguridad de Firestore**: Sube el archivo `firestore.rules`.
* **Índices de Firestore**: Sube el archivo `firestore.indexes.json` (requerido si realizas consultas compuestas complejas).
```bash
firebase deploy --only firestore
```

Puedes combinar múltiples filtros separados por comas:
```bash
firebase deploy --only hosting,firestore:rules
```

---

## Gestión de Múltiples Entornos (Desarrollo / Producción)

Si manejas proyectos de Firebase separados para Desarrollo/Staging y Producción, puedes alternar entre ellos fácilmente usando alias de proyecto.

### 1. Agregar un nuevo Proyecto
Vincula un nuevo ID de proyecto de Firebase a tu espacio de trabajo local asignándole un alias (ej: `produccion` o `staging`):
```bash
firebase use --add
```
*El CLI te pedirá seleccionar el proyecto y asignarle un nombre clave de alias.*

### 2. Cambiar de Entorno Activo
Para cambiar el destino de tus comandos de despliegue:
```bash
firebase use <nombre-del-alias>
```
*Ejemplo:* `firebase use default` (para desarrollo) o `firebase use produccion` (para producción).

### 3. Verificar Entorno Activo
Muestra la lista de alias configurados e indica con un asterisco (`*`) cuál es el activo actual:
```bash
firebase use
```

---

## Canales de Vista Previa (Hosting Channels)

Una funcionalidad muy útil para probar cambios antes de mandarlos a producción son los canales de vista previa temporales. Puedes desplegar una versión de prueba en una URL única que expira automáticamente:

```bash
firebase hosting:channel:deploy nombre-canal
```
* **`nombre-canal`**: Nombre que identificará la versión (ej. `nueva-interfaz-test`).
* **Expira en**: Por defecto expira en 7 días, pero puedes configurarlo con la flag `--expires 24h` o `--expires 30d`.

*Ejemplo de uso:*
```bash
firebase hosting:channel:deploy test-configuracion --expires 7d
```

---

## Simulación y Pruebas Locales (Emuladores)

Para verificar el comportamiento de las reglas de seguridad de Firestore y el hosting localmente antes de desplegar en vivo:

```bash
firebase emulators:start
```
Este comando levantará servidores locales de prueba:
* **Hosting**: Accesible en `http://localhost:5000`
* **Firestore Emulator**: Permite simular consultas de la base de datos.
* **Emulator Suite UI**: Un panel visual accesible por defecto en `http://localhost:4000` para ver tus bases de datos simuladas.
