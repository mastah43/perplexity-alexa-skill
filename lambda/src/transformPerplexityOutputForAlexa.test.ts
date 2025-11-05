import { transformPerplexityOutputForAlexa } from "./transformPerplexityOutputForAlexa";

describe("transformPerplexityOutputForAlexa", () => {

    function exectTransform(perplexity: string): jest.JestMatchers<string> {
        return expect(transformPerplexityOutputForAlexa(perplexity));
    }
    describe("regular cases", () => {
        it("should remove references in text", () => {
            exectTransform("This is a reference with a preceding space [1]. Text").toEqual("This is a reference with a preceding space. Text");
            exectTransform("This is a reference without space[1].").toEqual("This is a reference without space.");
        });
        it("should remove references start of text", () => {
            exectTransform("[2] Reference at beginning with space.").toEqual("Reference at beginning with space.");
            exectTransform("[3]Reference at beginning without space").toEqual("Reference at beginning without space");
        });

        it("should remove references end of text", () => {
            exectTransform("Reference at end with space [4]").toEqual("Reference at end with space.");
            exectTransform("Reference at end without space[5]").toEqual("Reference at end without space");
        });

        it("should remove bold text marking", () => {
            exectTransform("**bold**").toEqual("bold");
            exectTransform("Text1 **bold** text2").toEqual("Text1 bold text2");
            exectTransform("**bold** text").toEqual("bold text");
            exectTransform("text **bold**").toEqual("text bold");
        });

        it("should remove headline markings", () => {
            exectTransform("# headline").toEqual("headline");
            exectTransform("## headline").toEqual("headline");
            exectTransform("### headline").toEqual("headline");
            exectTransform("text # headline").toEqual("text headline");
            exectTransform("text ## headline").toEqual("text headline");
            exectTransform("text ## headline").toEqual("text headline");
        });
    });

});