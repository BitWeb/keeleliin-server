/**
 * Created by taivo on 12.06.15.
 */


function GrepWrapperContent() {

    this.service = {
        meta: {
            isAsync: true
        },
        params: {
            showLineNumbers: "yes",
            query: "ls",
            data: "abababab"
        },
        pipecontent: {}
    }

}

module.exports = GrepWrapperContent;