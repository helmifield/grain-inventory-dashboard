/*
 * GRAIN / MATERIAL PIECES
 * Plain CSV loader
 *
 * Source:
 * material-pieces.csv
 *
 * Rule:
 * Length >= 1,000 mm
 */

window.MATERIAL_PIECES_DATA = {
  views: [],
  rows: [],
  aliases: {}
};

(async function () {

  const response = await fetch(
    "./material-pieces.csv",
    {
      cache: "no-store"
    }
  );

  if (!response.ok) {
    throw new Error(
      "Could not load material-pieces.csv"
    );
  }

  const csv =
    await response.text();


  function parseCSV(text) {

    const rows = [];
    let row = [];
    let value = "";
    let quoted = false;

    for (
      let i = 0;
      i < text.length;
      i++
    ) {

      const char =
        text[i];

      const next =
        text[i + 1];


      if (
        char === '"' &&
        quoted &&
        next === '"'
      ) {

        value += '"';
        i++;
        continue;

      }


      if (
        char === '"'
      ) {

        quoted =
          !quoted;

        continue;

      }


      if (
        char === "," &&
        !quoted
      ) {

        row.push(value);
        value = "";

        continue;

      }


      if (
        (
          char === "\n" ||
          char === "\r"
        ) &&
        !quoted
      ) {

        if (
          char === "\r" &&
          next === "\n"
        ) {
          i++;
        }

        row.push(value);
        value = "";

        if (
          row.some(
            x => x !== ""
          )
        ) {
          rows.push(row);
        }

        row = [];

        continue;

      }


      value += char;

    }


    if (
      value !== "" ||
      row.length
    ) {

      row.push(value);

      if (
        row.some(
          x => x !== ""
        )
      ) {
        rows.push(row);
      }

    }


    return rows;

  }


  const parsed =
    parseCSV(csv);


  if (
    !parsed.length
  ) {

    throw new Error(
      "material-pieces.csv is empty."
    );

  }


  const headers =
    parsed[0].map(
      x =>
        x.trim()
    );


  const index =
    name =>
      headers.indexOf(
        name
      );


  const pieceId =
    index("Piece ID");

  const material =
    index("Material");

  const thickness =
    index("Thickness (mm)");

  const width =
    index("Width (mm)");

  const length =
    index("Length (mm)");

  const grade =
    index("Grade");

  const qty =
    index("Remaining Qty");

  const rack =
    index("Rack");

  const status =
    index("Material Status");

  const cbm =
    index("CBM per Piece");


  const rows =
    parsed
      .slice(1)
      .map(
        values => {

          const lengthValue =
            Number(
              values[length]
            );


          /*
           * Locked inventory rule:
           * ignore pieces below 1,000 mm.
           */

          if (
            !Number.isFinite(
              lengthValue
            ) ||
            lengthValue < 1000
          ) {

            return null;

          }


          const qtyValue =
            Number(
              values[qty]
            ) || 0;


          let cbmValue =
            Number(
              values[cbm]
            );


          /*
           * Calculate CBM if CSV
           * does not contain it.
           */

          if (
            !Number.isFinite(
              cbmValue
            )
          ) {

            cbmValue =
              (
                Number(
                  values[thickness]
                ) *
                Number(
                  values[width]
                ) *
                lengthValue *
                qtyValue
              ) /
              1000000000;

          }


          return {

            piece_id:
              values[pieceId] ||
              "UN",

            material:
              values[material] ||
              "Unassigned",

            thickness:
              Number(
                values[thickness]
              ) || 0,

            width:
              Number(
                values[width]
              ) || 0,

            length:
              lengthValue,

            grade:
              values[grade] ||
              "",

            qty:
              qtyValue,

            rack:
              values[rack] ||
              null,

            status:
              values[status] ||
              null,

            cbm:
              Number(
                cbmValue
              ) || 0

          };

        }
      )
      .filter(
        Boolean
      );


  /*
   * Build material views automatically.
   */

  const materials =
    [
      ...new Set(
        rows
          .map(
            row =>
              row.material
          )
          .filter(
            Boolean
          )
      )
    ]
    .sort();


  window.MATERIAL_PIECES_DATA =
    {
      views: [
        "Master",
        ...materials
      ],

      rows,

      aliases: {}
    };


  /*
   * Notify the HTML application.
   */

  window.dispatchEvent(
    new CustomEvent(
      "grain:material-data-ready"
    )
  );


})();
