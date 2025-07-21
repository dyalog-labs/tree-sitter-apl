import XCTest
import SwiftTreeSitter
import TreeSitterApl

final class TreeSitterAplTests: XCTestCase {
    func testCanLoadGrammar() throws {
        let parser = Parser()
        let language = Language(language: tree_sitter_apl())
        XCTAssertNoThrow(try parser.setLanguage(language),
                         "Error loading APL grammar")
    }
}
