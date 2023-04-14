const fs = require('fs');
const path = require('path');
export const mockHTML = fs.readFileSync(path.resolve(__dirname, './mockhtml.html'), 'utf8');
jest.dontMock('fs');