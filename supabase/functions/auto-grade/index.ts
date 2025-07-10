import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AutoGradeRequest {
  submission_id: string;
}

interface TestCase {
  id: string;
  cell_index: number;
  test_type: 'output_match' | 'code_contains' | 'function_exists' | 'variable_value';
  test_config: any;
  points: number;
  is_hidden: boolean;
}

interface SubmissionCell {
  content: string;
  output?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { submission_id }: AutoGradeRequest = await req.json();

    // Get submission details
    const { data: submission, error: submissionError } = await supabase
      .from('assignment_submissions')
      .select('*')
      .eq('id', submission_id)
      .single();

    if (submissionError || !submission) {
      throw new Error('Submission not found');
    }

    // Get assignment and notebook details
    const { data: assignment, error: assignmentError } = await supabase
      .from('notebook_assignments')
      .select(`
        *,
        notebooks (*)
      `)
      .eq('id', submission.assignment_id)
      .single();

    if (assignmentError || !assignment) {
      throw new Error('Assignment not found');
    }

    // Get test cases for the notebook
    const { data: testCases, error: testCasesError } = await supabase
      .from('notebook_test_cases')
      .select('*')
      .eq('notebook_id', assignment.notebook_id)
      .order('cell_index');

    if (testCasesError) {
      throw new Error('Failed to fetch test cases');
    }

    let totalScore = 0;
    let maxScore = 0;
    const feedback: any[] = [];
    const submittedCells = submission.submitted_content as SubmissionCell[];

    // Grade each test case
    for (const testCase of testCases || []) {
      maxScore += testCase.points;
      
      const cellContent = submittedCells[testCase.cell_index]?.content || '';
      const cellOutput = submittedCells[testCase.cell_index]?.output || '';
      
      let passed = false;
      let message = '';

      switch (testCase.test_type) {
        case 'output_match':
          const expectedOutput = testCase.test_config.expected_output;
          if (testCase.test_config.exact_match) {
            passed = cellOutput.trim() === expectedOutput.trim();
          } else {
            passed = cellOutput.toLowerCase().includes(expectedOutput.toLowerCase());
          }
          message = passed ? 
            'Output matches expected result' : 
            `Expected output containing: "${expectedOutput}", got: "${cellOutput}"`;
          break;

        case 'code_contains':
          const requiredCode = testCase.test_config.contains;
          passed = cellContent.toLowerCase().includes(requiredCode.toLowerCase());
          message = passed ? 
            `Code contains required pattern: "${requiredCode}"` : 
            `Code should contain: "${requiredCode}"`;
          break;

        case 'function_exists':
          const functionName = testCase.test_config.function_name;
          const functionPattern = new RegExp(`def\\s+${functionName}\\s*\\(`, 'i');
          passed = functionPattern.test(cellContent);
          message = passed ? 
            `Function "${functionName}" found` : 
            `Function "${functionName}" not found`;
          break;

        case 'variable_value':
          const variableName = testCase.test_config.variable_name;
          const expectedValue = testCase.test_config.expected_value;
          // Simple check - look for variable assignment in output or code
          const variablePattern = new RegExp(`${variableName}.*${expectedValue}`, 'i');
          passed = variablePattern.test(cellOutput) || variablePattern.test(cellContent);
          message = passed ? 
            `Variable "${variableName}" has correct value` : 
            `Variable "${variableName}" should equal "${expectedValue}"`;
          break;
      }

      if (passed) {
        totalScore += testCase.points;
      }

      feedback.push({
        cell_index: testCase.cell_index,
        test_type: testCase.test_type,
        passed,
        points_earned: passed ? testCase.points : 0,
        points_possible: testCase.points,
        message,
        is_hidden: testCase.is_hidden
      });
    }

    const percentageScore = maxScore > 0 ? (totalScore / maxScore) * 100 : 0;

    // Update the submission with auto-grade results
    const { error: updateError } = await supabase
      .from('assignment_submissions')
      .update({
        auto_grade_score: percentageScore,
        auto_grade_feedback: { 
          total_score: totalScore,
          max_score: maxScore,
          percentage: percentageScore,
          feedback 
        },
        status: 'graded'
      })
      .eq('id', submission_id);

    if (updateError) {
      throw new Error('Failed to update submission');
    }

    console.log(`Auto-grading completed for submission ${submission_id}: ${percentageScore}%`);

    return new Response(JSON.stringify({
      success: true,
      total_score: totalScore,
      max_score: maxScore,
      percentage: percentageScore,
      feedback: feedback.filter(f => !f.is_hidden) // Only return non-hidden feedback
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in auto-grade function:', error);
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});