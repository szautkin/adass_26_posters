import AppKit
import Foundation
import Vision

let path = CommandLine.arguments[1]
let url = URL(fileURLWithPath: path)
guard let image = NSImage(contentsOf: url) else {
    fputs("unreadable\n", stderr)
    exit(1)
}
var proposed = NSRect(origin: .zero, size: image.size)
guard let cgImage = image.cgImage(forProposedRect: &proposed, context: nil, hints: nil) else {
    fputs("no image\n", stderr)
    exit(1)
}
let request = VNRecognizeTextRequest()
request.recognitionLevel = .accurate
request.usesLanguageCorrection = true
let handler = VNImageRequestHandler(cgImage: cgImage, options: [:])
try handler.perform([request])
for observation in request.results ?? [] {
    if let text = observation.topCandidates(1).first?.string {
        print(text)
    }
}
