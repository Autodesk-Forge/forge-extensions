/////////////////////////////////////////////////////////////////////
// Copyright (c) Autodesk, Inc. All rights reserved
// Written by Forge Partner Development
//
// Permission to use, copy, modify, and distribute this software in
// object code form for any purpose and without fee is hereby granted,
// provided that the above copyright notice appears in all copies and
// that both that copyright notice and the limited warranty and
// restricted rights notice below appear in all supporting
// documentation.
//
// AUTODESK PROVIDES THIS PROGRAM "AS IS" AND WITH ALL FAULTS.
// AUTODESK SPECIFICALLY DISCLAIMS ANY IMPLIED WARRANTY OF
// MERCHANTABILITY OR FITNESS FOR A PARTICULAR USE.  AUTODESK, INC.
// DOES NOT WARRANT THAT THE OPERATION OF THE PROGRAM WILL BE
// UNINTERRUPTED OR ERROR FREE.
/////////////////////////////////////////////////////////////////////

if (!window.XLSX) alert('Sheet JS is required for this sample');

let ForgeXLS = {

  downloadXLSX: function (fileName, status) {

    if (status) {
      status(false, 'Preparing ' + fileName);
      status(false, 'Reading project information....');
    }

    this.prepareTables(function (tables) {
      if (status) status(false, 'Building XLSX file...');

      let wb = new Workbook();
      for (const [name, table] of Object.entries(tables)){
        if (name.indexOf('<')==-1) { // skip tables starting with <
          let ws = ForgeXLS.sheetFromTable(table);
          wb.SheetNames.push(name);
          wb.Sheets[name] = ws;
        }
      };

      let wbout = XLSX.write(wb, {bookType: 'xlsx', bookSST: true, type: 'binary'});
      saveAs(new Blob([s2ab(wbout)], {type: "application/octet-stream"}), fileName);

      if (status) status(true, 'Downloading...');
    })
  },

  sheetFromTable: function (table) {
    let ws = {};
    let range = {s: {c: 10000000, r: 10000000}, e: {c: 0, r: 0}};

    let allProperties = [];
    table.forEach(function (object) {
      for (const [propName, propValue] of Object.entries(object)){
        if (allProperties.indexOf(propName) == -1)
          allProperties.push(propName);
      }
    });

    table.forEach(function (object) {
      allProperties.forEach(function (propName) {
        if (!object.hasOwnProperty(propName))
          object[propName] = '';
      });
    });

    let propsNames = [];
    for (let propName in table[0]) {
      propsNames.push(propName);
    }
    //propsNames.sort(); // removed due first 3 ID columns

    let R = 0;
    let C = 0;
    for (; C != propsNames.length; ++C) {
      let cell_ref = XLSX.utils.encode_cell({c: C, r: R});
      ws[cell_ref] = {v: propsNames[C], t: 's'};
    }
    R++;

    for (let index = 0; index != table.length; ++index) {
      C = 0;
      propsNames.forEach(function (propName) {
        if (range.s.r > R) range.s.r = 0;
        if (range.s.c > C) range.s.c = 0;
        if (range.e.r < R) range.e.r = R;
        if (range.e.c < C) range.e.c = C;
        let cell = {v: table[index][propName]};
        if (cell.v == null) return;
        let cell_ref = XLSX.utils.encode_cell({c: C, r: R});

        if (typeof cell.v === 'number') cell.t = 'n';
        else if (typeof cell.v === 'boolean') cell.t = 'b';
        else if (cell.v instanceof Date) {
          cell.t = 'n';
          cell.z = XLSX.SSF._table[14];
          cell.v = datenum(cell.v);
        }
        else cell.t = 's';

        ws[cell_ref] = cell;
        C++;
      });
      R++;
    }
    if (range.s.c < 10000000) ws['!ref'] = XLSX.utils.encode_range(range);
    return ws;
  },
  
  prepareTables: function (callback) {
    let data = new ModelData(this);
    data.init(async function () {
        let hierarchy = data._modelData.Category;
        let t = await ForgeXLS.prepareRawData(hierarchy);
        callback(t);
    });
  },

  prepareRawData: async function (hierarchy) {
    let tables = {};
    for (let key in hierarchy) {
      let idsOnCategory = [];
      if (hierarchy.hasOwnProperty(key)) {
        idsOnCategory = hierarchy[key];        
        let rows = await getAllProperties(idsOnCategory);
        tables[key] = formatRows(rows);
      }
    }
    return tables;;
  }
};

// Get Properties by dbid
async function getProperties(model, dbid) {
  return new Promise(function(resolve, reject) {
      model.getProperties(dbid, function (props) {
          resolve(props);
      });
  });
}

// Get Properties by Category
async function getAllProperties(idsOnCategory) {
  return new Promise(function(resolve, reject) {
      let promises = [];
      idsOnCategory.forEach(function (dbid) {
        promises.push(getProperties(NOP_VIEWER.model, dbid));
      });
      resolve(Promise.all(promises));
  });
}

//  Helper Functions
function Workbook() {
  if (!(this instanceof Workbook)) return new Workbook();
  this.SheetNames = [];
  this.Sheets = {};
}

function datenum(v, date1904) {
  if (date1904) v += 1462;
  let epoch = Date.parse(v);
  return (epoch - new Date(Date.UTC(1899, 11, 30))) / (24 * 60 * 60 * 1000);
}

function s2ab(s) {
  let buf = new ArrayBuffer(s.length);
  let view = new Uint8Array(buf);
  for (let i = 0; i != s.length; ++i) view[i] = s.charCodeAt(i) & 0xFF;
  return buf;
}

function formatRows(sheets) {
  sheets.forEach(sheet => {
    let props = sheet.properties
    props.forEach(prop =>{
      sheet[prop.displayName] = prop.displayValue
    })
    delete sheet.properties
  });
  return sheets;
}