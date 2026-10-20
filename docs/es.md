# RappelConso

Las retiradas de productos en Francia, en Gladys Assistant: alimentos, artículos de bebé,
cosméticos, aparatos, coches… tal como las publica [RappelConso](https://rappel.conso.gouv.fr), el
sitio oficial de retiradas de la administración francesa (DGCCRF, DGAL y otras). Reciba un aviso
cuando se retire un producto de las categorías, marcas o códigos de barras que sigue. Sin cuenta,
sin clave de API.

Un complemento: no es un sistema de alerta oficial. Compruebe siempre la ficha de retirada y siga
sus indicaciones. Sin afiliación con la administración francesa.

## Lo que obtiene

- Un **dispositivo «Retiradas de productos»**: retiradas del día y de los últimos 7 días en su
  selección, la última retirada con su fecha y el número de retiradas en curso que mencionan uno de
  sus códigos de barras.
- Un **disparador de escena** «nueva retirada en mi selección», filtrable por categoría, con el
  producto, la marca, el motivo, los riesgos y el enlace de la retirada como variables de escena.
- Un **disparador prioritario** «se retira uno de mis códigos de barras», para los productos que
  tiene en casa, incluso si la retirada se publicó antes de añadir el código.
- Una **acción de escena** que lee las retiradas de la semana en una frase.
- Un **widget del panel** con las últimas retiradas, sus códigos de barras primero, y los enlaces a
  las fichas oficiales.

## Requisitos

- Gladys Assistant 5.1.0 o posterior (widgets, disparadores y acciones de escena).
- Acceso a Internet de Gladys a `data.economie.gouv.fr`.
- Nada más: los datos son abiertos y se leen sin cuenta.

## Configuración

### Ajustes

| Ajuste                             | Función                                                                                                                                                        |
| ---------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Categorías                         | Se siguen las retiradas de estas categorías. Todas por defecto; unas 90 retiradas por semana, tres cuartas partes de alimentos.                                |
| Marcas o palabras                  | Opcional. Solo las retiradas que mencionan alguna (marca, producto o referencias), separadas por comas. Palabras completas; acentos y mayúsculas indiferentes. |
| Códigos de barras de sus productos | Opcional. Las cifras bajo los códigos de barras (EAN, de 8 a 14 cifras), separadas por comas. Seguidos en todas las categorías.                                |
| Intervalo de actualización         | De 15 minutos a 6 horas; 1 hora por defecto.                                                                                                                   |
| Idioma de los textos               | Nombres de las funciones (al crearlas) y textos enviados a las escenas. Las fichas de retirada siguen en francés.                                              |

Guarde y cree el dispositivo en la pestaña **Descubrir** de la integración. El botón **Mostrar las
retiradas de la semana** vuelve a leer RappelConso y muestra lo que contiene su selección.

### La selección seguida

Una retirada está en su selección cuando su categoría se sigue **y**, si ha escrito marcas o
palabras, menciona alguna. Por ejemplo, las categorías «Bebés y niños» y «Alimentación» con las
palabras `lait infantile, petit pot` siguen la alimentación infantil y todos los artículos de bebé.
Las fichas están en francés: escriba palabras en francés.

Los códigos de barras se siguen **sean cuales sean las categorías**: una retirada que menciona uno
de ellos siempre está en su selección. También se buscan en **todo el historial** de RappelConso:
una retirada publicada hace meses y aún en curso también cuenta. Una retirada está en curso hasta la
fecha de fin de su procedimiento; RappelConso ya no rellena esa fecha desde julio de 2026, así que
la mayoría de las retiradas recientes siguen contándose.

## Dispositivo

| Función                  | Tipo     | Valor                                                                      |
| ------------------------ | -------- | -------------------------------------------------------------------------- |
| Retiradas de hoy         | Contador | Retiradas de su selección publicadas hoy (zona horaria de Gladys).         |
| Retiradas en 7 días      | Contador | Lo mismo en los últimos 7 días.                                            |
| Última retirada          | Texto    | La más reciente, p. ej. `20/10 · Confit de canard 1240g (Jean larnaudie)`. |
| Retiradas de mis códigos | Contador | Retiradas en curso, de cualquier fecha, que mencionan uno de sus códigos.  |

Los contadores conservan su historial. «Retiradas de hoy» vuelve a 0 en la primera actualización
después de medianoche.

## Widget del panel

**Retiradas de productos**: el número de retiradas de la semana y luego hasta 8 retiradas: primero
las que mencionan sus códigos de barras (insignia roja «Su producto»), luego las más recientes de su
selección (insignia naranja: la categoría). Toque una fila para ver el motivo, los riesgos, qué
hacer y los enlaces a la ficha de retirada y a su cartel imprimible.

## Disparadores de escena

**RappelConso: nueva retirada en mi selección.** Una ficha de retirada vista por primera vez, en su
selección. Filtro: las categorías (vacío: todas). Una ficha corregida (nueva versión de una
retirada anterior) no lo dispara, ni tampoco las retiradas de la semana ya publicadas cuando amplía
su selección, ni las encontradas en el primer arranque.

**RappelConso: se retira uno de mis códigos de barras.** Una retirada en curso menciona por primera
vez uno de sus códigos de barras. Filtro opcional: un código, escrito como en los ajustes. También
se dispara cuando añade el código de un producto ya retirado.

Variables de ambos disparadores: producto, marca, categoría (clave estable como `food`), categoría
en palabras, motivo, riesgos, enlace a la ficha de retirada, un resumen en una frase y el código de
barras en el segundo disparador. Producto, marca, motivo y riesgos están en francés, tal como los
publica RappelConso.

## Acción de escena

**RappelConso: leer las retiradas de la semana.** Salidas: las retiradas de su selección en 7 días
en una frase (5 mencionadas como máximo, luego las retiradas de sus códigos), su número y el número
de retiradas en curso de sus códigos de barras. Si nunca se ha podido acceder a RappelConso, la
acción falla con un mensaje claro.

## Ejemplos de escenas

- **Su producto ha sido retirado**: disparador «se retira uno de mis códigos de barras», luego enviar
  un mensaje `{{triggerEvent.data.summary}} {{triggerEvent.data.url}}` y hacer parpadear una lámpara
  en rojo.
- **Artículos de bebé**: disparador «nueva retirada en mi selección» con la categoría «Bebés y
  niños», luego enviar un mensaje con el producto, el motivo y el enlace.
- **Resumen semanal**: cada sábado a las 10:00, la acción «leer las retiradas de la semana», luego
  enviar su texto por mensaje o hacer que se lea en voz alta.

## Fuentes de datos, condiciones y cuotas

Las retiradas proceden del conjunto de datos abierto
[RappelConso V2](https://data.economie.gouv.fr/explore/dataset/rappelconso-v2-gtin-espaces/) del
Ministerio de Economía francés, publicado bajo la
[Licence Ouverte 2.0 (Etalab)](https://www.etalab.gouv.fr/licence-ouverte-open-licence/): la
reutilización es libre, citando la fuente. Fuente: RappelConso, DGCCRF y las demás administraciones
que publican en él.

Cada actualización envía una solicitud (dos con códigos de barras) a la API de Opendatasoft. La
cuota anónima es de 50 000 solicitudes al día por dirección: una vez por hora son unas 50
solicitudes al día. El conjunto de datos se actualiza varias veces al día.

## Solución de problemas

- **El dispositivo no aparece**: guarde la configuración y abra la pestaña Descubrir de la
  integración.
- **«RappelConso no responde»**: data.economie.gouv.fr no es accesible o está saturado. Las últimas
  retiradas siguen mostrándose y la integración lo vuelve a intentar en cada actualización.
- **«Ignorado (no es un código de barras de 8 a 14 cifras)»**: un código de la lista contiene letras
  o demasiado pocas cifras; escriba las cifras impresas bajo las barras.
- **Falta una retirada esperada**: compruebe su categoría en la ficha y las palabras escritas
  (palabras completas: `lait` no encuentra `laitier`).
- **Más detalles**: ajuste `LOG_LEVEL=debug` en la integración y lea sus registros.

## Límites

- Solo Francia, y solo lo que publica RappelConso: una retirada anunciada antes en otro lugar puede
  aparecer más tarde.
- Una retirada se encuentra por categoría, palabras y códigos de barras; un producto vendido con otro
  nombre o sin código en la ficha puede escaparse. Compruebe siempre la ficha antes de tirar un
  producto.
- Los textos de las fichas están en francés.
- «Retiradas de hoy» se actualiza en la primera actualización después de medianoche.
- Sin afiliación con la administración francesa. Datos: RappelConso, Licence Ouverte 2.0.
