Add-Type -AssemblyName System.Speech

$audioDir = "e:\mansi\hackathon\remotion-video\public\audio"
if (!(Test-Path $audioDir)) {
    New-Item -ItemType Directory -Force -Path $audioDir
}

$scenes = @(
    @{
        name = "scene1_problem.wav"
        text = "During a flood, the challenge is not just identifying inundated areas. Emergency teams must understand what may be exposed, which routes could be disrupted, and how limited resources can reach affected communities."
    },
    @{
        name = "scene2_intro.wav"
        text = "Lifeline OS is a flood-impact intelligence and emergency-response decision-support prototype. It connects geographic evidence, infrastructure analysis, accessibility assessment and constrained response planning into one workflow."
    },
    @{
        name = "scene3_evidence.wav"
        text = "The workflow starts with available flood, weather, geographic and infrastructure evidence. Source provenance, timestamps, geographic validity and missing data all matter before conclusions can be drawn."
    },
    @{
        name = "scene4_impact.wav"
        text = "Validated geographic evidence can help identify potentially exposed infrastructure and examine road accessibility. A spatial intersection is evidence of potential exposure, not proof of damage or a confirmed road closure."
    },
    @{
        name = "scene5_planning.wav"
        text = "Response planning must account for available resources, demand, priorities and operational constraints. A feasible recommendation should follow from those inputs. When constraints cannot be satisfied, the system must expose the limitation rather than invent a plan."
    },
    @{
        name = "scene6_review.wav"
        text = "Lifeline OS is designed to support human decisions, not replace them. Evidence, assumptions and constraints should remain traceable, and operational action must remain subject to appropriate review."
    },
    @{
        name = "scene7_architecture.wav"
        text = "The architecture separates external evidence from validation, geospatial processing and decision logic. Each recommendation can then be understood in the context of its inputs, assumptions and constraints."
    },
    @{
        name = "scene8_close.wav"
        text = "Lifeline OS brings flood evidence, infrastructure exposure and response planning into a connected decision-support workflow. The objective is clearer situational awareness, more transparent decisions and better-informed emergency response."
    }
)

foreach ($sc in $scenes) {
    $synth = New-Object System.Speech.Synthesis.SpeechSynthesizer
    # Choose installed voice
    $synth.SelectVoice("Microsoft Zira Desktop")
    $synth.Rate = 0
    $outPath = Join-Path $audioDir $sc.name
    $synth.SetOutputToWaveFile($outPath)
    $synth.Speak($sc.text)
    $synth.Dispose()
    Write-Output "Generated $($sc.name)"
}

Write-Output "All 8 narration voice files generated successfully!"
