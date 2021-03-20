"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.csvWriter = void 0;
const writer = __importStar(require("csv-writer"));
exports.csvWriter = writer.createObjectCsvWriter({
    path: './opportunitiesGreaterThan.csv',
    header: [
        { id: 'block', title: 'Block Number' },
        { id: 'coin1', title: 'Start/End Coin' },
        { id: 'coin2', title: 'Mid Coin' },
        { id: 'exchange1', title: 'Start Exchange' },
        { id: 'exchange2', title: 'End Exchange' },
        { id: 'initial', title: 'Initial Amount' },
        { id: 'final', title: 'Final Amount' },
        { id: 'diff1', title: 'Diff in Start Coin' },
        { id: 'diff2', title: 'Diff in Dai' },
        { id: 'optimized', title: 'Optimized' }
    ]
});
