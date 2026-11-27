# Agendas múltiples, nota general y configuración

**Estado:** implementado en la interfaz de demostración.  
**Alcance:** frontend y estado local; no incluye API, autenticación, persistencia ni cambios de base de datos.

## Objetivo

Permitir que una cuenta de ALAFE organice varios negocios o espacios de trabajo, cada uno con su agenda, eventos, nombre predeterminado de reserva y nota compartida. La operación diaria debe dejar visible a qué agenda pertenece el calendario y facilitar el cambio entre agendas. La creación y administración de agendas queda dentro de **Configuración**, para mantener la vista diaria enfocada en operar.

## Decisiones de experiencia

### Selector de agenda

- La vista Agenda muestra el nombre de la agenda activa con un botón compacto de lista desplegable.
- El menú muestra las demás agendas disponibles y actualiza el nombre, la nota y los datos de demostración al cambiar de opción.
- La creación de agendas no aparece como acción de operación diaria; se ofrece solamente en Configuración.
- El selector permite crecer a más de dos agendas sin convertir la cabecera en una fila de pestañas demasiado extensa.

### Nota general

- Cada agenda tiene una nota independiente, editable en sus ajustes y de solo lectura en la vista Agenda.
- La nota solo se muestra cuando está habilitada y contiene texto; así no reserva espacio vacío.
- En escritorio se coloca debajo del calendario, dentro de la columna izquierda. En móvil se antepone al calendario para que el equipo la vea al entrar.
- Se presenta como aviso informativo de baja fricción, con contraste legible y sin competir visualmente con las reservas.

### Configuración

- Se separan **General** y **Por agenda** mediante navegación interna.
- General contiene el nombre común del espacio de trabajo. La zona horaria se mantiene como estándar de sistema para evitar diferencias de horario entre agendas.
- Por agenda permite elegir una agenda existente o agregar una nueva y editar su nombre, moneda, nombre predeterminado al agendar, visibilidad de la nota y texto de la nota.
- El valor de nombre predeterminado se usa como título inicial al abrir una nueva reserva; editar una reserva conserva su título existente.
- Los controles reflejan cambios inmediatamente en la interfaz. La persistencia y los permisos se definirán al conectar backend.

## Modelo de interfaz

```ts
interface AgendaProfile {
  id: string
  name: string
  currency: 'MXN' | 'USD'
  defaultEventName: string
  showGeneralNote: boolean
  generalNote: string
}

interface WorkspaceSettings {
  name: string
}
```

Los eventos reales deberán pertenecer a una agenda mediante `AgendaId`. Las notas son propiedades de agenda, no de evento ni de cliente. El estado local de esta iteración sirve únicamente para demostrar el flujo visual.

## Plan de implementación

1. Definir datos locales de varias agendas y ajustes generales compartidos.
2. Añadir selector visible en Agenda y asociar calendario, título y nota a la agenda elegida.
3. Mostrar una nota informativa por agenda, debajo del calendario en escritorio y antes del calendario en móvil.
4. Convertir Configuración en una vista con secciones General y Por agenda; dejar allí la acción de agregar agenda y la moneda propia de cada agenda.
5. Usar el nombre predeterminado de la agenda al iniciar la captura de un evento nuevo.
6. Mantener las tarjetas, etiquetas y acciones de eventos existentes sin cambios y revisar compilación TypeScript/Vite.

## Consideraciones para backend

- El modelo de datos futuro necesita entidad `Agendas` asociada al tenant/cliente y una relación de cada evento con su agenda.
- El nombre pertenece al espacio de trabajo; la moneda, el nombre predeterminado, la nota y su indicador de visibilidad pertenecen a cada agenda.
- Definir en backend el acceso de lectura de la nota para usuarios de esa cuenta y permisos de edición para roles autorizados.
- La actualización de nota debe tener autoría y fecha de modificación si se requiere trazabilidad; el texto no debe reemplazar notas particulares de cada evento.
- Una migración deberá asignar los eventos actuales a una agenda inicial y definir reglas para renombrar o desactivar agendas con eventos.
