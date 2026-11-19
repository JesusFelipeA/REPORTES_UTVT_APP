# Aviso de privacidad: Reportes UTVT

**Responsable:** Jesus Felipe Aviles, desarrollador de la app como proyecto de la materia Desarrollo Móvil Integral (Universidad Tecnológica del Valle de Toluca).
**Contacto:** al222310418@utvtol.edu.mx
**Última actualización:** 19 de noviembre de 2026 (versión 1.1.0)

## Qué datos se recaban
| Dato | Para qué |
|---|---|
| Correo institucional y contraseña | Iniciar sesión. La contraseña la guarda cifrada el servicio de autenticación (Supabase Auth); la app no la almacena |
| Reportes: categoría, ubicación, descripción y fecha | Registrar la falla y darle seguimiento |
| Foto de evidencia (opcional) | Mostrar al personal de mantenimiento el problema |
| Ubicación del reporte (opcional): latitud, longitud y precisión | Que mantenimiento encuentre el lugar de la falla. Se toma una sola vez, al pulsar **Usar mi ubicación actual**; el usuario puede elegir ubicación aproximada o escribir el lugar a mano |
| Rol (estudiante o mantenimiento) | Decidir qué reportes puede ver y modificar cada usuario |

No se rastrea la ubicación en segundo plano. No se recaban contactos, datos de pago ni datos sensibles.

## Permisos del teléfono
- **Internet:** enviar y consultar reportes.
- **Cámara (opcional):** solo cuando el usuario decide tomar la foto de evidencia; se pide en ese momento y puede negarse. También se puede elegir una foto de la galería (no requiere permiso).
- **Ubicación (opcional):** precisa o aproximada, solo con la app abierta y al pulsar **Usar mi ubicación actual**.

El estado de cada permiso se consulta en la pantalla **Permisos** de la app y se puede retirar en cualquier momento desde los ajustes de Android.

## Quién puede ver la información
- Cada estudiante ve solo sus propios reportes.
- El personal de mantenimiento ve todos los reportes para atenderlos.
- Las fotos están en un almacenamiento privado y se muestran con enlaces que vencen a los 60 minutos.
- La información no se vende ni se comparte con terceros. Se almacena en Supabase (proveedor de base de datos en la nube).

## Seguridad
Conexión cifrada (HTTPS), sesión guardada cifrada en el teléfono (Keystore/Keychain), reglas de acceso por usuario en la base de datos (Row Level Security) y bloqueo temporal tras 5 intentos fallidos de inicio de sesión.

## Tus derechos (ARCO)
Puedes pedir acceder, rectificar, cancelar u oponerte al uso de tus datos, o que se elimine tu cuenta y tus reportes, escribiendo a **al222310418@utvtol.edu.mx**. Se responde en un máximo de 20 días hábiles, conforme a la Ley Federal de Protección de Datos Personales en Posesión de los Particulares.

## Cambios a este aviso
Cualquier cambio se publicará en este mismo enlace y se indicará la fecha de actualización.
