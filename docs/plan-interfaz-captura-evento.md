# ALAFE — Captura rápida de eventos

**Estado:** implementado en la interfaz de demostración  
**Alcance actual:** interfaz de demostración, sin persistencia ni conexión al backend.

## Propósito

La interfaz para agendar debe permitir capturar rápidamente el rango y horario del evento, añadir los datos necesarios del cliente y registrar las condiciones particulares de la reserva. Debe funcionar primero en dispositivos móviles y mostrar campos adicionales solo cuando una decisión del usuario los vuelve necesarios.

El formulario busca reducir pasos, no eliminar información requerida por la operación. Los datos opcionales deben permanecer fuera del flujo principal hasta que sean necesarios.

## Referencias consultadas

- `ALAFE-PROYECTO-ING-SOFTWARE.pdf`: campos del evento y cliente, cargos, movimientos y validaciones.
- `Proyecto ALAFE.pdf`: prioridades mobile-first y formularios móviles.
- `especificaci_n_funcional_y_arquitectura_alafe.md`: reglas de decoración, cliente opcional, costos, saldo y movimientos.
- `diagramas_de_flujo_y_procesos_operativos_alafe.md`: orden del flujo y validación de duración y empalmes.
- `backend/Data/Scripts/001_Initial_Schema_And_Seed.sql`: modelo SQL actual para eventos.

## Decisiones funcionales propuestas

### 1. Eliminar “Ocupa dos días”

La duración se representa mediante fecha y hora de inicio y fecha y hora de fin. El checkbox `Ocupa dos días` se elimina: el evento abarca una o más fechas cuando su intervalo de inicio y fin así lo indica.

En el formulario se muestran:

- Fecha de inicio y hora de inicio.
- Fecha de fin y hora de fin.
- La fecha seleccionada en el calendario se usa como inicio y fin iniciales.
- La hora de decoración se captura como fecha y hora cuando corresponda.

La interfaz presenta el intervalo completo al usuario. En las iteraciones posteriores de backend, este intervalo deberá almacenarse como inicio y fin de fecha-hora completos, en vez de inferir la duración a partir de un booleano.

### 2. Varios eventos en un mismo día

Una fecha no se considera ocupada solo porque contenga un evento. Se permiten varios eventos cuando sus intervalos no se empalman. La validación conceptual es:

```text
evento existente inicia antes de que termine el nuevo
y
evento existente termina después de que inicie el nuevo
```

Los intervalos se tratarán como `[inicio, fin)`: si uno termina a las 14:00 y otro inicia a las 14:00, pueden ser consecutivos sin empalmarse. La decoración, cuando esté activa, amplía el intervalo reservado hacia atrás desde su hora de inicio.

En el calendario, cada día que interseca el intervalo se marcará como ocupado. Al seleccionar una fecha ocupada, la interfaz mostrará sus eventos y horarios; no bloqueará la fecha completa.

## Campos y dependencias

| Dato o decisión | Campos que se muestran | Regla propuesta |
|---|---|---|
| Siempre | Fecha y hora de inicio, fecha y hora de fin, costo base | Inicio y fin son obligatorios. Fin debe ser posterior a inicio y la duración mínima es una hora. |
| Decoración activada | Fecha y hora de inicio de decoración | Obligatorio si se solicita decoración; debe ocurrir antes del inicio del evento. |
| Horas extra mayores que cero | Costo por hora extra | El número de horas inicia en cero. El costo por hora se muestra y requiere valor solo si hay horas extra. |
| Cliente asociado | Nombre, apellidos, teléfono, correo, calle/dirección, colonia y número exterior | La asociación del cliente es opcional al crear un evento. Al activarla, se expande una captura compacta de datos. |
| Anticipo o abono activado | Tipo de operación, monto y, si aplica, moneda/tipo de cambio | Captura opcional. La documentación funcional indica que el cliente es obligatorio al confirmar un anticipo; la interfaz debe pedir cliente antes de permitir confirmar ese movimiento. |
| Evento especial activado | Indicador visual de condición especial | La documentación no define campos adicionales obligatorios para esta opción. Por ahora se conserva como indicador y cualquier explicación puede escribirse en notas. |
| Nota agregada | Campo de nota | Opcional; se muestra al solicitar “Agregar nota”. |

El costo total se presenta en vivo como `costo base + (horas extra × costo por hora)`. El saldo de eventos existentes se deriva de los movimientos: `costo total − (anticipos + abonos − devoluciones)`. Un anticipo inicial no debe confundirse con el costo total ni reemplazar el historial de movimientos.

## Orden propuesto para el flujo móvil

1. **Fecha y horario:** intervalo de inicio/fin en la parte superior. La fecha elegida en el calendario sirve como valor inicial.
2. **Datos rápidos del cliente:** opción “Asociar cliente” cerrada por defecto; al activarla, permitir buscar/identificar por teléfono y mostrar nombre y datos adicionales.
3. **Condiciones del evento:** decoración, evento especial y horas extra. Cada opción revela solamente su campo dependiente.
4. **Precio y notas:** costo base, resumen calculado y notas opcionales.
5. **Anticipo opcional:** acción secundaria que revela el movimiento inicial y aplica la regla de cliente obligatorio.
6. **Acción fija inferior:** “Agendar evento” o “Guardar cambios”, con errores de validación cerca de la sección correspondiente.

En móvil, el editor se presenta como una vista de pantalla completa con desplazamiento interno y acción inferior fija. En escritorio puede ser un diálogo ancho o panel lateral. El diseño mantiene los campos principales visibles antes de los detalles opcionales.

## Validaciones de interfaz

- Fin posterior al inicio y duración de al menos una hora.
- Inicio de decoración anterior al inicio del evento.
- Costo por hora requerido solo cuando las horas extra sean mayores que cero.
- Anticipo/abono mayor a cero y cliente asociado antes de confirmar el movimiento.
- Aviso de empalme contra datos de demostración, comparando rangos de fecha-hora, no solo fechas.
- Eventos con movimientos no se eliminan directamente; la interfaz remite a devolución/cancelación según la regla documentada.

En esta etapa estas comprobaciones son solo visuales y operan con los datos de demostración del frontend.

## Plan de implementación del frontend

1. Actualizar `EventComposer` para usar fecha-hora de inicio y fin, quitando el checkbox de dos días.
2. Ajustar el calendario para seleccionar rango de fechas y resaltar todos los días comprendidos por cada evento.
3. Reordenar el formulario con el flujo mobile-first descrito arriba.
4. Implementar dependencias condicionales para decoración, horas extra, cliente, anticipo y notas.
5. Calcular costo total y saldo de demostración; aplicar validaciones visuales de duración, decoración, cliente, anticipo y empalmes.
6. Conservar las acciones de movimientos, devolución, trazabilidad y eliminación para eventos existentes, distinguiéndolas del flujo de creación.
7. Revisar legibilidad, accesibilidad táctil, mensajes de error, modo claro/oscuro y ajuste a móvil/escritorio.

## Resultado aplicado en el frontend

- El formulario usa fechas y horas de inicio/fin; ya no ofrece el checkbox `Ocupa dos días`.
- La agenda permite marcar un rango y resalta las fechas del intervalo. Un evento de muestra cruza la medianoche y dos reservas distintas comparten una fecha con horarios no empalmados.
- Decoración, tarifa por horas extra, cliente, anticipo y notas aparecen según su dependencia. La búsqueda de cliente muestra que el directorio aún no está conectado y permite continuar con captura manual.
- El resumen calcula costo de horas extra, costo total y saldo de demostración; el anticipo admite MXN, USD y EUR con tipo de cambio manual.

## Iteración: acceso directo desde el calendario y fechas compactas

**Estado:** implementado en la interfaz de demostración.  
**Alcance:** interacción y presentación frontend; no crea, modifica ni persiste información en backend.

### Decisiones de interacción

- Un clic en un día selecciona la fecha y muestra su información debajo del calendario. Dos clics (o doble toque) en el día abren el formulario de nueva reserva con ese día como fecha inicial y final.
- Tocar una anotación de evento abre el mismo formulario en modo edición y carga los datos del evento seleccionado.
- La anotación y el botón del día son controles independientes. Así, la acción de editar no activa también la creación de una reserva.
- Cada evento anotado conserva una acción propia, incluidos varios eventos en la misma fecha. En móvil, las anotaciones se muestran como indicadores táctiles compactos con nombre accesible para lectores de pantalla.
- El selector explícito **Seleccionar rango** se conserva como alternativa para agendar fechas consecutivas desde el calendario. Al completar la selección, abre el formulario con el rango inicializado.
- Se retiran las acciones principales separadas **Nuevo evento** y **Agregar evento** del encabezado/detalle del día. La instrucción visible orienta a consultar con un clic y agendar con doble clic en el calendario.

### Fechas en el formulario

- En una reserva de un día se muestra una sola fecha, con las horas de inicio y fin. La fecha se presenta con el mes escrito en español, por ejemplo: **11 de noviembre de 2026**.
- **Agregar fecha de fin** expande el formulario con fecha de inicio y fecha de fin. Al volver a un solo día, la fecha final se iguala a la inicial.
- Los eventos existentes con fechas diferentes abren directamente la vista de rango. La duración se sigue calculando con fechas y horas completas, por lo que el rango también cubre eventos que terminan después de medianoche.
- La fecha de decoración también se presenta con el mes escrito. El valor subyacente sigue siendo una fecha para los controles y cálculos locales.
- El encabezado mensual ya usa el mes escrito y conserva ese formato (`Noviembre 2026`).

### Consideraciones de experiencia

- En móvil, las anotaciones se reducen visualmente a indicadores dentro de la celda para conservar espacio, y cada indicador sigue siendo independiente y abre su evento.
- En escritorio se conserva el nombre de cada evento en su anotación.
- Los eventos y cambios permanecen como datos de demostración; editar muestra el formulario prellenado y no guarda cambios.

### Alcance de la siguiente etapa

Conectar los eventos del calendario a persistencia y definir la política de actualización real queda fuera de esta iteración. El flujo de frontend ya separa creación desde un día, edición desde un evento y captura de una fecha final distinta.
- Las validaciones de duración, decoración, anticipo y empalmes se realizan en el navegador contra datos estáticos.
- Los formularios y acciones siguen siendo de demostración; no se persiste ni se envía información.

La interacción con el calendario cubre el prototipo visual de rangos dentro de las fechas mostradas. Persistencia, disponibilidad autoritativa y concurrencia continúan fuera del alcance frontend.

## Consideración para una fase backend futura

El esquema SQL actual guarda `FechaEvento` como `DATE` y `HoraInicio`/`HoraFin` como `TIME(0)`, además de exigir que la hora final sea posterior a la inicial. Ese modelo no representa de forma directa un evento que termina al día siguiente. El script tampoco relaciona `Eventos` con una entidad `Agenda`, aunque las reglas funcionales dicen que cada evento pertenece a una agenda/negocio.

Antes de conectar persistencia habrá que acordar una migración de esquema que modele intervalos completos y agenda propietaria. Esa migración, la validación transaccional ante reservas simultáneas y la persistencia quedan fuera del alcance de esta iteración de interfaz.
