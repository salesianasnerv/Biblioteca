# Cómo poner en marcha la web de la biblioteca

Se hace **una sola vez** y se tarda unos 10 minutos. Todo con la cuenta **@nervion.salesianas.org**, no con la de Office 365.

## 1. La hoja de cálculo

1. En Google Drive, abre la hoja del catálogo que subiste.
2. Si arriba pone **.XLSX** junto al nombre, ve a **Archivo → Guardar como Hojas de cálculo de Google** y trabaja a partir de ahora con esa copia nueva. Puedes borrar la .xlsx.
3. Cámbiale el nombre a algo como **Biblioteca – base de datos**.

## 2. Pegar el código (solo copiar y pegar)

1. En la hoja, ve a **Extensiones → Apps Script**. Se abre una pestaña nueva.
2. Arriba a la izquierda, cambia el nombre «Proyecto sin título» por **Biblioteca**.
3. Verás un archivo llamado `Código.gs`. Borra todo lo que tiene y pega el contenido completo de **Codigo.gs** (ábrelo con TextEdit o el Bloc de notas, selecciona todo y copia).
4. Pulsa el **+** junto a «Archivos» → **HTML** y llámalo exactamente **Index** (sin «.html»). Borra lo que trae y pega el contenido completo de **Index.html**.
5. Pulsa el icono del disquete (**Guardar**).
6. En **Configuración del proyecto** (rueda dentada de la izquierda), pon la zona horaria **(GMT+01:00) Madrid**.

## 3. Preparar la hoja

1. Vuelve al editor (icono `< >` de la izquierda). En la barra de arriba, elige la función **configurar** y pulsa **Ejecutar**.
2. Google pedirá permisos: **Revisar permisos** → elige tu cuenta → **Permitir**.
3. Al volver a la hoja verás que la pestaña «Catálogo» se llama ahora **Libros** y que hay pestañas nuevas: Lectores, Préstamos, Reservas, Gestores, Ajustes e Historial. **Tú ya estás en Gestores.**

## 4. Publicar la web

1. En el editor de Apps Script: **Implementar → Nueva implementación**.
2. En «Seleccionar tipo» (rueda dentada) elige **Aplicación web**.
3. Rellena así:
   - **Descripción:** Biblioteca
   - **Ejecutar como:** **Yo** (tu correo)
   - **Quién tiene acceso:** **Cualquier usuario de Salesianas Nervión** (o de nervion.salesianas.org)
4. Pulsa **Implementar** y copia la **URL de la aplicación web**. Esa es la dirección de la biblioteca.
   - Desde la hoja también la tienes en el menú **Biblioteca → Abrir la web**.

## 5. Primeros pasos en la web

1. **Alumnado:** ve a Administración → Alumnado → **Importar listado de Google**. Pega el Excel de usuarios (Ctrl+A / Cmd+A, copiar y pegar).
2. **Quién gestiona:** ve a Administración → Quién gestiona y añade a Ana y a quien vaya a llevar la biblioteca.
3. **Revisión del catálogo:** ve a Administración → Libros → filtro **Con avisos**. Ahí están los libros que hay que revisar. Los **provisionales** no deben llevar tejuelo hasta confirmar su etapa.
4. **Etiquetas:** en Administración → Libros, filtra por **Pendientes de tejuelo** y usa **Imprimir tejuelos de esta lista** y **Imprimir etiquetas QR de esta lista**.

---

## ⚠ Muy importante si algún día se cambia el código

Para que los **QR ya pegados en los libros sigan funcionando**, la dirección de la web no puede cambiar. Por eso, al actualizar:

**Implementar → Gestionar implementaciones → ✏️ (editar) → Versión: «Nueva versión» → Implementar.**

**Nunca** uses «Nueva implementación» después de la primera vez, porque crearía otra dirección distinta.

## Preguntas frecuentes

- **¿Puedo tocar la hoja a mano?** Sí, pero es mejor hacerlo desde la web, porque así queda registrado en el Historial. No cambies los títulos de las columnas (la primera fila) ni los nombres de las pestañas.
- **¿Cómo cambio los días de préstamo o el máximo de libros?** En Administración → Ajustes.
- **¿El alumnado ve quién tiene un libro?** No. Solo ve si está disponible y, si no lo está, cuándo debería volver.
- **¿Un alumno puede usar la web desde el móvil?** Sí, con su cuenta del colegio iniciada en el navegador.
- **¿Qué pasa en septiembre?** Se descarga el listado nuevo de usuarios y se importa otra vez. Los cursos se actualizan solos y las bajas se marcan solas.
