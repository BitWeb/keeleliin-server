/**
 * Created by priit on 10.06.15.
 * @param {String("")} corpora
 */

function Content() {


    this.structure = {
        corpora: '', //korpus
        sourceFile: '', //lähtefail e valueObject
        file: '', //faili nimi
        content: '', //lähtfaili sisu tekst // kõik, mis võib jsoni katki teha peaks olema escaped
        contentType: 'text',

        //pm võiks allolevad propertid lahtiseks jätta? või oskab server just nendega hiljem midagi rohkem teha?
        parts: [{ //osa
            idx: 0,
            file:'', //lähtefail ??
            type: '',// nt ??
            location: {
                start:0,
                end:0
            }
        }],
        paragraphs: [{ //lõik
            idx: 0,
            file:'',
            type: '',// nt ??
            location: {
                start:0,
                end:0
            }
        }],
        clauses: [{ //osalause
            idx: 0,
            file: '',
            location: {
                start:0,
                end:0
            }
        }],
        sentences:[{ //lause // -> Token
            idx: 0,
            file: '',
            location: {
                start:0,
                end:0
            }
        }],
        phrases: [{ //phrase -> Clause -> Sentence -> Paragraph -> Part ??
            idx: 0,
            file:'',
            type: '',// nt ??
            location: {
                start:0,
                end:0
            }
        }],
        tokens: [{ //sõne
            idx: 0,
            file: '',
            value: '',
            location: {
                start:0,
                end:0
            }
        }],
        tags: [{ //märgend
            idx: 0,
            file:'',
            type: '',// nt LM e. Lemma
            value: '',
            location: {
                start:0,
                end:0
            }
        }],
        syllables: [{ //silp // -> Token
            idx: 0,
            file: '',
            location: {
                start:0,
                end:0
            }
        }]
    };
}

module.exports = Content;
