import AppKit
import Foundation
import Vision

let path = CommandLine.arguments[1]
let url = URL(fileURLWithPath: path)
let request = VNDetectRectanglesRequest()
request.minimumAspectRatio = 0.25
request.maximumAspectRatio = 1.0
request.minimumSize = 0.2
request.minimumConfidence = 0.2
request.maximumObservations = 8
request.quadratureTolerance = 30

let handler = VNImageRequestHandler(url: url, options: [:])
try handler.perform([request])
let results = request.results ?? []
if results.isEmpty {
    fputs("NONE\n", stderr)
    exit(2)
}
for obs in results {
    let tl = obs.topLeft
    let tr = obs.topRight
    let br = obs.bottomRight
    let bl = obs.bottomLeft
    print(
        String(
            format: "%.4f %.4f %.4f %.4f %.4f %.4f %.4f %.4f %.3f",
            tl.x, tl.y, tr.x, tr.y, br.x, br.y, bl.x, bl.y, obs.confidence
        )
    )
}
