// Calculate BMI automatically
document.getElementById('height').addEventListener('input', updateBMI);
document.getElementById('weight').addEventListener('input', updateBMI);

function updateBMI() {
  const height = parseFloat(document.getElementById('height').value) / 100; // cm to m
  const weight = parseFloat(document.getElementById('weight').value);
  
  if (height && weight) {
    const bmi = (weight / (height * height)).toFixed(1);
    document.getElementById('bmi').value = bmi;
    
    // Color coding for BMI
    let bmiClass = '';
    if (bmi < 18.5) bmiClass = 'underweight';
    else if (bmi >= 18.5 && bmi < 25) bmiClass = 'normal';
    else if (bmi >= 25 && bmi < 30) bmiClass = 'overweight';
    else bmiClass = 'obese';
    
    document.getElementById('bmi').className = bmiClass;
  }
}

// Risk Assessment Logic
document.getElementById('riskForm').addEventListener('submit', function(e) {
  e.preventDefault();
  
  const submitBtn = document.getElementById('submitBtn');
  const spinner = document.getElementById('spinner');
  const resultDiv = document.getElementById('result');
  
  // Show loading spinner
  submitBtn.disabled = true;
  spinner.style.display = 'block';
  resultDiv.style.display = 'none';
  
  // Simulate API call delay
  setTimeout(() => {
    // Get form values
    const age = parseInt(document.getElementById('age').value);
    const gender = document.getElementById('gender').value;
    const height = parseFloat(document.getElementById('height').value);
    const weight = parseFloat(document.getElementById('weight').value);
    const systolic = parseInt(document.getElementById('systolic').value);
    const diastolic = parseInt(document.getElementById('diastolic').value);
    const cholesterol = parseInt(document.getElementById('cholesterol').value);
    const glucose = parseInt(document.getElementById('glucose').value);
    const smoking = document.getElementById('smoking').value;
    const alcohol = document.getElementById('alcohol').value;
    const activity = document.getElementById('activity').value;
    const sleep = parseFloat(document.getElementById('sleep').value);
    const history = document.getElementById('history').value.toLowerCase().split(',').map(item => item.trim());
    
    // Calculate BMI
    const bmi = (weight / ((height / 100) ** 2)).toFixed(1);
    
    // Risk Scoring
    let riskScore = 0;
    
    // Age
    if (age > 50) riskScore += 2;
    else if (age > 40) riskScore += 1;
    
    // Gender
    if (gender === 'male') riskScore += 1;
    
    // BMI
    if (bmi >= 30) riskScore += 3;
    else if (bmi >= 25) riskScore += 2;
    else if (bmi < 18.5) riskScore += 1;
    
    // Blood Pressure
    if (systolic >= 140 || diastolic >= 90) riskScore += 3;
    else if (systolic >= 130 || diastolic >= 85) riskScore += 2;
    
    // Cholesterol
    if (cholesterol >= 240) riskScore += 3;
    else if (cholesterol >= 200) riskScore += 2;
    
    // Glucose
    if (glucose >= 126) riskScore += 3;
    else if (glucose >= 100) riskScore += 1;
    
    // Lifestyle
    if (smoking === 'current') riskScore += 4;
    else if (smoking === 'former') riskScore += 2;
    
    if (alcohol === 'heavy') riskScore += 2;
    else if (alcohol === 'moderate') riskScore += 1;
    
    if (activity === 'sedentary') riskScore += 2;
    else if (activity === 'light') riskScore += 1;
    
    if (sleep < 6 || sleep > 9) riskScore += 1;
    
    // Medical History
    if (history.includes('diabetes')) riskScore += 3;
    if (history.includes('hypertension')) riskScore += 2;
    if (history.includes('heart disease')) riskScore += 4;
    
    // Determine Risk Level
    let riskLevel, advice, riskClass;
    if (riskScore >= 15) {
      riskLevel = 'High Risk';
      advice = 'Consult a doctor immediately. Lifestyle changes and medical intervention are strongly recommended.';
      riskClass = 'risk-high';
    } else if (riskScore >= 8) {
      riskLevel = 'Medium Risk';
      advice = 'Monitor your health regularly. Consider lifestyle improvements and consult a doctor if symptoms arise.';
      riskClass = 'risk-medium';
    } else {
      riskLevel = 'Low Risk';
      advice = 'Maintain your healthy habits! Regular check-ups are still advised.';
      riskClass = 'risk-low';
    }
    
    // Display Result
    spinner.style.display = 'none';
    resultDiv.style.display = 'block';
    resultDiv.className = riskClass;
    submitBtn.disabled = false;
    
    resultDiv.innerHTML = `
      <div class="result-item" style="animation-delay: 0.1s">
        <h3>Your Risk Assessment</h3>
      </div>
      <div class="result-item" style="animation-delay: 0.2s">
        <p><strong>Risk Level:</strong> <span class="${riskScore >= 15 ? 'obese heartbeat' : riskScore >= 8 ? 'overweight' : 'normal'}">${riskLevel}</span></p>
      </div>
      <div class="result-item" style="animation-delay: 0.3s">
        <p><strong>BMI:</strong> ${bmi} (<span class="${getBMIClass(bmi)}">${getBMICategory(bmi)}</span>)</p>
      </div>
      <div class="result-item" style="animation-delay: 0.4s">
        <p><strong>Blood Pressure:</strong> ${systolic}/${diastolic} mmHg (${getBPCategory(systolic, diastolic)})</p>
      </div>
      <div class="result-item" style="animation-delay: 0.5s">
        <p><strong>Cholesterol:</strong> ${cholesterol} mg/dL (${getCholesterolCategory(cholesterol)})</p>
      </div>
      <div class="result-item" style="animation-delay: 0.6s">
        <p><strong>Glucose:</strong> ${glucose} mg/dL (${getGlucoseCategory(glucose)})</p>
      </div>
      <div class="result-item" style="animation-delay: 0.7s">
        <p><strong>Advice:</strong> ${advice}</p>
      </div>
    `;
  }, 1500);
});

// Helper Functions
function getBMIClass(bmi) {
  bmi = parseFloat(bmi);
  if (bmi < 18.5) return 'underweight';
  else if (bmi < 25) return 'normal';
  else if (bmi < 30) return 'overweight';
  else return 'obese';
}

function getBMICategory(bmi) {
  bmi = parseFloat(bmi);
  if (bmi < 18.5) return 'Underweight';
  else if (bmi < 25) return 'Normal';
  else if (bmi < 30) return 'Overweight';
  else return 'Obese';
}

function getBPCategory(systolic, diastolic) {
  if (systolic >= 140 || diastolic >= 90) return 'High (Hypertension)';
  else if (systolic >= 130 || diastolic >= 85) return 'Elevated';
  else return 'Normal';
}

function getCholesterolCategory(chol) {
  if (chol >= 240) return 'High';
  else if (chol >= 200) return 'Borderline High';
  else return 'Normal';
}

function getGlucoseCategory(glucose) {
  if (glucose >= 126) return 'High (Diabetes)';
  else if (glucose >= 100) return 'Prediabetes';
  else return 'Normal';
}