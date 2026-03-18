import {
  Course,
  Question,
  AssessmentPaper,
  AssessmentTemplate,
  User,
  Session,
  Department,
  Programme,
} from "../types";
import {
  LearningDomain,
  Taxonomy,
  ItemType,
  DublinAccord,
} from "../types";
import { supabase } from "./supabase";

// We now strictly require Supabase configuration.
const isSupabaseConfigured = Boolean(
  import.meta.env.VITE_SUPABASE_URL &&
  (import.meta.env.VITE_SUPABASE_ANON_KEY ||
    import.meta.env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY),
);

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  // If Supabase is not configured, throw an error immediately
  if (!isSupabaseConfigured) {
    throw new Error(
      "Supabase is not configured. Please check your environment variables.",
    );
  }

  const method = options?.method || "GET";
  const data = options?.body ? JSON.parse(options.body as string) : null;

  try {
    if (path.includes("/departments")) {
      if (method === "GET") {
        const { data: depts, error } = await supabase
          .from("departments")
          .select("*");
        if (error) throw error;
        // Map backend columns to frontend (code, name)
        return (depts || []).map((d: Record<string, unknown>) => ({
          id: (d['id'] || d['department_id'] || d['dept_id']) as string,
          name: (d['name'] || d['department_name'] || d['dept_name'] || d['title']) as string,
          code: (d['code'] || d['abbr'] || d['dept_code'] || d['short_name']) as string,
        })) as T;
      }
      if (method === "POST") {
        const dbData: Record<string, unknown> = {
          name: data.name,
          code: data.code,
          department_name: data.name, // Fallback for legacy schema
          abbr: data.code, // Fallback for legacy schema
        };
        // Ensure ID is not sent for new records
        const { data: dept, error } = await supabase
          .from("departments")
          .insert([dbData])
          .select()
          .single();
        if (error) {
          // If it failed because of extra columns, try with just name/code
          const { data: dept2, error: error2 } = await supabase
            .from("departments")
            .insert([{ 
              name: data.name, 
              code: data.code,
              department_name: data.name,
              abbr: data.code 
            }])
            .select()
            .single();
          
          if (error2) {
             // Try with legacy names only
             const { data: dept3, error: error3 } = await supabase
               .from("departments")
               .insert([{ department_name: data.name, abbr: data.code }])
               .select()
               .single();
             if (error3) {
               // Try with just name/code again but without select().single() in case RLS prevents reading
               const { error: error4 } = await supabase
                 .from("departments")
                 .insert([{ name: data.name, code: data.code }]);
               if (error4) throw error4;
               return { id: Date.now().toString(), ...data } as T;
             }
             return {
               id: dept3.id || dept3.department_id || dept3.dept_id,
               name: dept3.name || dept3.department_name,
               code: dept3.code || dept3.abbr,
             } as T;
          }
          return {
            id: dept2.id || dept2.department_id || dept2.dept_id,
            name: dept2.name || dept2.department_name,
            code: dept2.code || dept2.abbr,
          } as T;
        }
        return {
          id: dept.id || dept.department_id || dept.dept_id,
          name: dept.name || dept.department_name,
          code: dept.code || dept.abbr,
        } as T;
      }
      if (method === "PUT") {
        const dbData: Record<string, unknown> = {
          name: data.name,
          code: data.code,
          department_name: data.name,
          abbr: data.code,
        };
        const { data: dept, error } = await supabase
          .from("departments")
          .update(dbData)
          .eq("id", data.id)
          .select()
          .single();
        
        if (error) {
          // Try with just name/code
          const { data: dept2, error: error2 } = await supabase
            .from("departments")
            .update({ name: data.name, code: data.code })
            .eq("id", data.id)
            .select()
            .single();
          
          if (error2) {
            // Try with legacy names only
            const { data: dept3, error: error3 } = await supabase
              .from("departments")
              .update({ department_name: data.name, abbr: data.code })
              .eq("id", data.id)
              .select()
              .single();
            if (error3) throw error3;
            return {
              id: dept3.id,
              name: dept3.name || dept3.department_name,
              code: dept3.code || dept3.abbr,
            } as T;
          }
          return {
            id: dept2.id,
            name: dept2.name || dept2.department_name,
            code: dept2.code || dept2.abbr,
          } as T;
        }
        return {
          id: dept.id,
          name: dept.name || dept.department_name,
          code: dept.code || dept.abbr,
        } as T;
      }
      if (method === "DELETE") {
        const id = path.split("/").filter(Boolean).pop();
        const { error } = await supabase
          .from("departments")
          .delete()
          .eq("id", id);
        if (error) throw error;
        return {} as T;
      }
    }

    if (path.includes("/programmes")) {
      if (method === "GET") {
        const { data: progs, error } = await supabase
          .from("programmes")
          .select("*");
        if (error) throw error;
        return (progs || []).map((p: Record<string, unknown>) => ({
          ...p,
          id: (p['id'] || p['programme_id'] || p['prog_id']) as string,
          name: (p['name'] || p['programme_name'] || p['title']) as string,
          code: (p['code'] || p['programme_code'] || p['short_name']) as string,
          deptId: (p['deptId'] || p['department_id'] || p['dept_id']) as string,
          headOfProgramme: (p['headOfProgramme'] || p['head_of_programme'] || p['head_of_dept']) as string,
        })) as T;
      }
      if (method === "POST") {
        const dbData: Record<string, unknown> = {
          name: data.name,
          code: data.code,
          programme_name: data.name,
          programme_code: data.code,
          department_id: data.deptId || null,
          head_of_programme: data.headOfProgramme || null,
        };
        const { data: prog, error } = await supabase
          .from("programmes")
          .insert([dbData])
          .select()
          .single();
        
        if (error) {
          const { data: prog2, error: error2 } = await supabase
            .from("programmes")
            .insert([{
              name: data.name,
              code: data.code,
              department_id: data.deptId || null,
              head_of_programme: data.headOfProgramme || null,
            }])
            .select()
            .single();
          
          if (error2) {
            const { data: prog3, error: error3 } = await supabase
              .from("programmes")
              .insert([{
                programme_name: data.name,
                programme_code: data.code,
                department_id: data.deptId || null,
                head_of_programme: data.headOfProgramme || null,
              }])
              .select()
              .single();
            if (error3) throw error3;
            return {
              ...prog3,
              name: prog3.name || prog3.programme_name,
              code: prog3.code || prog3.programme_code,
              deptId: prog3.department_id,
              headOfProgramme: prog3.head_of_programme,
            } as T;
          }
          return {
            ...prog2,
            name: prog2.name || prog2.programme_name,
            code: prog2.code || prog2.programme_code,
            deptId: prog2.department_id,
            headOfProgramme: prog2.head_of_programme,
          } as T;
        }
        return {
          ...prog,
          name: prog.name || prog.programme_name,
          code: prog.code || prog.programme_code,
          deptId: prog.department_id,
          headOfProgramme: prog.head_of_programme,
        } as T;
      }
      if (method === "PUT") {
        const dbData: Record<string, unknown> = {
          name: data.name,
          code: data.code,
          programme_name: data.name,
          programme_code: data.code,
          department_id: data.deptId || null,
          head_of_programme: data.headOfProgramme || null,
        };
        const { data: prog, error } = await supabase
          .from("programmes")
          .update(dbData)
          .eq("id", data.id)
          .select()
          .single();
        
        if (error) {
          const { data: prog2, error: error2 } = await supabase
            .from("programmes")
            .update({
              name: data.name,
              code: data.code,
              department_id: data.deptId || null,
              head_of_programme: data.headOfProgramme || null,
            })
            .eq("id", data.id)
            .select()
            .single();
          
          if (error2) {
            const { data: prog3, error: error3 } = await supabase
              .from("programmes")
              .update({
                programme_name: data.name,
                programme_code: data.code,
                department_id: data.deptId || null,
                head_of_programme: data.headOfProgramme || null,
              })
              .eq("id", data.id)
              .select()
              .single();
            if (error3) throw error3;
            return {
              ...prog3,
              name: prog3.name || prog3.programme_name,
              code: prog3.code || prog3.programme_code,
              deptId: prog3.department_id,
              headOfProgramme: prog3.head_of_programme,
            } as T;
          }
          return {
            ...prog2,
            name: prog2.name || prog2.programme_name,
            code: prog2.code || prog2.programme_code,
            deptId: prog2.department_id,
            headOfProgramme: prog2.head_of_programme,
          } as T;
        }
        return {
          ...prog,
          name: prog.name || prog.programme_name,
          code: prog.code || prog.programme_code,
          deptId: prog.department_id,
          headOfProgramme: prog.head_of_programme,
        } as T;
      }
      if (method === "DELETE") {
        const id = path.split("/").filter(Boolean).pop();
        const { error } = await supabase
          .from("programmes")
          .delete()
          .eq("id", id);
        if (error) throw error;
        return {} as T;
      }
    }

    if (path.includes("/users/")) {
      if (path.includes("/update") && method === "PUT") {
        const id = path.split("/")[2];

        const dbData: Record<string, unknown> = { ...data };
        if (data.email !== undefined) {
          dbData.username = data.email;
          delete dbData.email;
        }
        if (data.deptId !== undefined) {
          dbData.department_id = data.deptId || null;
          delete dbData.deptId;
        }
        if (data.programmeId !== undefined) {
          dbData.programme_id = data.programmeId || null;
          delete dbData.programmeId;
        }

        const { data: user, error } = await supabase
          .from("users")
          .update(dbData)
          .eq("id", id)
          .select()
          .single();
        if (error) throw error;
        return {
          user: {
            ...user,
            email: user.username,
            deptId: user.department_id,
            programmeId: user.programme_id,
          },
        } as unknown as T;
      }
      if (method === "POST") {
        const dbData: Record<string, unknown> = {
          ...data,
          username: data.email,
          department_id: data.deptId || null,
          programme_id: data.programmeId || null,
        };
        delete dbData.deptId;
        delete dbData.programmeId;
        delete dbData.password;
        delete dbData.email;

        const { data: user, error } = await supabase
          .from("users")
          .insert([dbData])
          .select()
          .single();
        if (error) throw error;
        return {
          ...user,
          email: user.username,
          deptId: user.department_id,
          programmeId: user.programme_id,
        } as unknown as T;
      }
      if (method === "DELETE") {
        const id = path.split("/")[2];
        const { error } = await supabase
          .from("users")
          .delete()
          .eq("id", id);
        if (error) throw error;
        return {} as unknown as T;
      }
      if (method === "GET") {
        const { data: users, error } = await supabase.from("users").select("*");
        if (error) throw error;
        return (users || []).map((u: Record<string, unknown>) => {
          console.log('Mapping user:', u);
          return {
            ...u,
            email: u.username as string,
            deptId: u.department_id as string,
            programmeId: u.programme_id as string,
          };
        }) as unknown as T;
      }
    }

    if (path.includes("/sessions")) {
      if (method === "GET") {
        const { data: sessions, error } = await supabase
          .from("academic_sessions")
          .select("*");
        if (error) throw error;
        return (sessions || []).map((s) => ({
          ...s,
          isActive: s.is_active,
          isArchived: s.is_archived,
        })) as T;
      }
      if (method === "POST") {
        const { data: session, error } = await supabase
          .from("academic_sessions")
          .insert([{ name: data.name }])
          .select()
          .single();
        if (error) throw error;
        return {
          ...session,
          isActive: session.is_active,
          isArchived: session.is_archived,
        } as T;
      }
      if (method === "PUT") {
        if (data.isActive) {
          const { error: deactivateError } = await supabase
            .from("academic_sessions")
            .update({ is_active: false })
            .neq("id", data.id);
          if (deactivateError) console.error("Deactivate error:", deactivateError);
          
          const { data: session, error } = await supabase
            .from("academic_sessions")
            .update({ is_active: true, is_archived: false })
            .eq("id", data.id)
            .select()
            .single();
          if (error) throw error;
          return {
            ...session,
            isActive: session.is_active,
            isArchived: session.is_archived,
          } as T;
        }
        const { data: session, error } = await supabase
          .from("academic_sessions")
          .update(data)
          .eq("id", data.id)
          .select()
          .single();
        if (error) throw error;
        return {
          ...session,
          isActive: session.is_active,
          isArchived: session.is_archived,
        } as T;
      }
      if (method === "DELETE") {
        const id = path.split("/").filter(Boolean).pop();
        const { error } = await supabase
          .from("academic_sessions")
          .delete()
          .eq("id", id);
        if (error) throw error;
        return {} as T;
      }
    }

    if (path.includes("/courses/")) {
      if (method === "GET") {
        const { data: courses, error } = await supabase.from("courses").select(`
            *,
            clos ( id, code, description ),
            topics ( id, code, name )
          `);
        if (error) throw error;

        return (courses || []).map((c) => {
          const closRecord: Record<string, string> = {};
          c.clos?.forEach((clo: { code: string; description: string }) => {
            closRecord[clo.code] = clo.description;
          });

          const topicsArray =
            c.topics?.map(
              (t: { code: string; name: string }) => `${t.code} ${t.name}`,
            ) || [];

          const jsuTemplate: unknown[] = typeof c.jsu_template === 'string' ? (c.jsu_template ? JSON.parse(c.jsu_template) : []) : (c.jsu_template || []);

          return {
            ...c,
            deptId: c.department_id,
            programmeId: c.programme_id,
            clos: Object.keys(closRecord).length > 0 ? closRecord : c.clos,
            topics: topicsArray.length > 0 ? topicsArray : c.topics,
            assessmentPolicies: typeof c.assessment_policies === 'string' ? (c.assessment_policies ? JSON.parse(c.assessment_policies) : []) : (c.assessment_policies || []),
            jsuTemplate: jsuTemplate,
            da: typeof c.mqfs === 'string' ? (c.mqfs ? JSON.parse(c.mqfs) : {}) : (c.mqfs || {}),
            daMappings: typeof c.mqf_mappings === 'string' ? (c.mqf_mappings ? JSON.parse(c.mqf_mappings) : {}) : (c.mqf_mappings || {}),
          };
        }) as T;
      }
      if (method === "POST" || method === "PUT") {
        const { data: courseId, error } = await supabase.rpc(
          "save_course_data",
          {
            course_json: data,
          },
        );

        if (error) throw error;

        // Ensure JSONB fields are saved directly in case the RPC function is outdated
        const { error: updateError } = await supabase
          .from("courses")
          .update({
            assessment_policies: data.assessmentPolicies || [],
            jsu_template: data.jsuTemplate || [],
            mqfs: data.da || {},
            mqf_mappings: data.daMappings || {}
          })
          .eq("id", courseId);

        if (updateError) throw updateError;

        const { data: savedCourse, error: fetchError } = await supabase
          .from("courses")
          .select("*")
          .eq("id", courseId)
          .single();

        if (fetchError) throw fetchError;

        return {
          ...savedCourse,
          deptId: savedCourse.department_id,
          programmeId: savedCourse.programme_id,
          assessmentPolicies: typeof savedCourse.assessment_policies === 'string' ? (savedCourse.assessment_policies ? JSON.parse(savedCourse.assessment_policies) : []) : (savedCourse.assessment_policies || []),
          jsuTemplate: typeof savedCourse.jsu_template === 'string' ? (savedCourse.jsu_template ? JSON.parse(savedCourse.jsu_template) : []) : (savedCourse.jsu_template || []),
          da: typeof savedCourse.mqfs === 'string' ? (savedCourse.mqfs ? JSON.parse(savedCourse.mqfs) : {}) : (savedCourse.mqfs || {}),
          daMappings: typeof savedCourse.mqf_mappings === 'string' ? (savedCourse.mqf_mappings ? JSON.parse(savedCourse.mqf_mappings) : {}) : (savedCourse.mqf_mappings || {}),
        } as T;
      }
      if (method === "DELETE") {
        const id = path.split("/").filter(Boolean).pop();
        const { error } = await supabase.from("courses").delete().eq("id", id);
        if (error) throw error;
        return {} as T;
      }
    }

    if (path.includes("/questions/")) {
      if (method === "GET") {
        const { data: questions, error } = await supabase
          .from("questions")
          .select("*");
        if (error) throw error;
        return (questions || []).map((q) => ({
          ...q,
          courseId: q.course_id,
          sectionTitle: q.section_title,
          cloKeys: q.clo_keys || [],
          daKeys: q.mqf_keys || [],
          subQuestions: q.sub_questions || [],
          options: q.options || [],
          imageUrl: q.image_url,
          figureLabel: q.figure_label,
          mediaType: q.media_type,
          tableData: q.table_data,
          construct: q.construct,
          domain: q.domain,
          answerImageUrl: q.answer_image_url,
          answerFigureLabel: q.answer_figure_label,
        })) as T;
      }
      if (method === "POST") {
        const newQuestion = {
          course_id: data.courseId,
          section_title: data.sectionTitle,
          text: data.text,
          marks: data.marks,
          taxonomy: data.taxonomy,
          topic: data.topic,
          type: data.type,
          answer: data.answer,
          clo_keys: data.cloKeys,
          mqf_keys: data.daKeys,
          sub_questions: data.subQuestions,
          options: data.options,
          image_url: data.imageUrl,
          figure_label: data.figureLabel,
          media_type: data.mediaType,
          table_data: data.tableData,
          construct: data.construct,
          domain: data.domain,
          answer_image_url: data.answerImageUrl,
          answer_figure_label: data.answerFigureLabel,
        };
        const { data: question, error } = await supabase
          .from("questions")
          .insert([newQuestion])
          .select()
          .single();
        if (error) throw error;
        return {
          ...question,
          courseId: question.course_id,
          sectionTitle: question.section_title,
          cloKeys: question.clo_keys,
          daKeys: question.mqf_keys,
          subQuestions: question.sub_questions,
          options: question.options,
          imageUrl: question.image_url,
          figureLabel: question.figure_label,
          mediaType: question.media_type,
          tableData: question.table_data,
          construct: question.construct,
          domain: question.domain,
          answerImageUrl: question.answer_image_url,
          answerFigureLabel: question.answer_figure_label,
        } as T;
      }
      if (method === "PUT") {
        const updateQuestion = {
          course_id: data.courseId,
          section_title: data.sectionTitle,
          text: data.text,
          marks: data.marks,
          taxonomy: data.taxonomy,
          topic: data.topic,
          type: data.type,
          answer: data.answer,
          clo_keys: data.cloKeys,
          mqf_keys: data.daKeys,
          sub_questions: data.subQuestions,
          options: data.options,
          image_url: data.imageUrl,
          figure_label: data.figureLabel,
          media_type: data.mediaType,
          table_data: data.tableData,
          construct: data.construct,
          domain: data.domain,
          answer_image_url: data.answerImageUrl,
          answer_figure_label: data.answerFigureLabel,
        };
        const { data: question, error } = await supabase
          .from("questions")
          .update(updateQuestion)
          .eq("id", data.id)
          .select()
          .single();
        if (error) throw error;
        return {
          ...question,
          courseId: question.course_id,
          sectionTitle: question.section_title,
          cloKeys: question.clo_keys,
          daKeys: question.mqf_keys,
          subQuestions: question.sub_questions,
          options: question.options,
          imageUrl: question.image_url,
          figureLabel: question.figure_label,
          mediaType: question.media_type,
          tableData: question.table_data,
          construct: question.construct,
          domain: question.domain,
          answerImageUrl: question.answer_image_url,
          answerFigureLabel: question.answer_figure_label,
        } as T;
      }
    }

    if (path.includes("/papers/")) {
      if (method === "GET") {
        const { data: papers, error } = await supabase
          .from("assessment_papers")
          .select("*");
        if (error) throw error;
        return (papers || []).map((p) => ({
          ...p,
          courseId: p.course_id,
          sessionId: p.session_id,
          authorId: p.author_id,
          assignedReviewerId: p.assigned_reviewer_id,
          header: p.header_data || {},
          matrix: p.matrix_data || [],
          studentInfo: p.student_info || {},
          instructions: p.instructions || [],
          footer: p.footer_data || {},
          questions: p.questions || [],
          cloDefinitions: p.clo_definitions || {},
          daClusters: p.mqf_clusters || {},
          feedback: p.feedback || "",
          checklist: p.checklist || [],
          checklistNotes: p.checklist_notes || [],
          history: p.history || [],
        })) as T;
      }
      if (method === "POST") {
        const newPaper = {
          course_id: data.courseId,
          session_id: data.sessionId,
          author_id: data.authorId,
          assigned_reviewer_id: data.assignedReviewerId,
          status: data.status,
          header_data: data.header,
          matrix_data: data.matrix,
          student_info: data.studentInfo,
          instructions: data.instructions,
          footer_data: data.footer,
          questions: data.questions,
          clo_definitions: data.cloDefinitions,
          mqf_clusters: data.daClusters,
          feedback: data.feedback,
          checklist: data.checklist,
          checklist_notes: data.checklistNotes,
          history: data.history,
        };
        const { data: paper, error } = await supabase
          .from("assessment_papers")
          .insert([newPaper])
          .select()
          .single();
        if (error) throw error;
        return {
          ...paper,
          courseId: paper.course_id,
          sessionId: paper.session_id,
          authorId: paper.author_id,
          assignedReviewerId: paper.assigned_reviewer_id,
          header: paper.header_data || {},
          matrix: paper.matrix_data || [],
          studentInfo: paper.student_info || {},
          instructions: paper.instructions || [],
          footer: paper.footer_data || {},
          questions: paper.questions || [],
          cloDefinitions: paper.clo_definitions || {},
          daClusters: paper.mqf_clusters || {},
          feedback: paper.feedback || "",
          checklist: paper.checklist || [],
          checklistNotes: paper.checklist_notes || [],
          history: paper.history || [],
        } as T;
      }
      if (method === "PUT") {
        const updatePaper = {
          course_id: data.courseId,
          session_id: data.sessionId,
          author_id: data.authorId,
          assigned_reviewer_id: data.assignedReviewerId,
          status: data.status,
          header_data: data.header,
          matrix_data: data.matrix,
          student_info: data.studentInfo,
          instructions: data.instructions,
          footer_data: data.footer,
          questions: data.questions,
          clo_definitions: data.cloDefinitions,
          mqf_clusters: data.daClusters,
          feedback: data.feedback,
          checklist: data.checklist,
          checklist_notes: data.checklistNotes,
          history: data.history,
        };
        const { data: paper, error } = await supabase
          .from("assessment_papers")
          .update(updatePaper)
          .eq("id", data.id)
          .select()
          .single();
        if (error) throw error;
        return {
          ...paper,
          courseId: paper.course_id,
          sessionId: paper.session_id,
          authorId: paper.author_id,
          assignedReviewerId: paper.assigned_reviewer_id,
          header: paper.header_data || {},
          matrix: paper.matrix_data || [],
          studentInfo: paper.student_info || {},
          instructions: paper.instructions || [],
          footer: paper.footer_data || {},
          questions: paper.questions || [],
          cloDefinitions: paper.clo_definitions || {},
          daClusters: paper.mqf_clusters || {},
          feedback: paper.feedback || "",
          checklist: paper.checklist || [],
          checklistNotes: paper.checklist_notes || [],
          history: paper.history || [],
        } as T;
      }
    }

    if (path.includes("/lookup/")) {
      const table = path.split("/")[2];
      if (method === "GET") {
        const { data: lookupData, error } = await supabase
          .from(table)
          .select("*");
        if (error) throw error;
        return (lookupData || []) as T;
      }
      if (method === "POST") {
        const { data: lookupData, error } = await supabase
          .from(table)
          .insert([data])
          .select()
          .single();
        if (error) throw error;
        return lookupData as T;
      }
      if (method === "PUT") {
        const { data: lookupData, error } = await supabase
          .from(table)
          .update(data)
          .eq("id", data.id)
          .select()
          .single();
        if (error) throw error;
        return lookupData as T;
      }
      if (method === "DELETE") {
        const id = path.split("/").filter(Boolean).pop();
        const { error } = await supabase.from(table).delete().eq("id", id);
        if (error) throw error;
        return {} as T;
      }
    }
  } catch (error) {
    console.error("Supabase request failed:", error);
    throw error;
  }

  throw new Error(`Endpoint not implemented: ${path}`);
}

export const api = {
  isSupabaseConfigured,
  auth: {
    signInWithGoogle: async () => {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        },
      });
      if (error) throw error;
      return data;
    },
    login: async (email: string, password: string): Promise<{ user: User; token: string }> => {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      if (!data.session) throw new Error("No session returned");
      
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', data.user.id)
        .single();
        
      if (profileError) throw profileError;
      
      return {
        user: {
          id: profile.id,
          email: profile.username,
          full_name: profile.full_name,
          role: profile.role,
          position: profile.position,
          deptId: profile.department_id,
          programmeId: profile.programme_id
        } as User,
        token: data.session.access_token
      };
    },
    register: async (params: { email: string; full_name: string; position?: string; deptId?: string; password: string }): Promise<{ user: User; token: string }> => {
      const { data, error } = await supabase.auth.signUp({
        email: params.email,
        password: params.password,
        options: {
          data: {
            full_name: params.full_name,
            position: params.position,
            department_id: params.deptId
          }
        }
      });
      if (error) throw error;
      
      if (!data.session) {
        // Email confirmation required
        return { user: {} as User, token: '' };
      }
      
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', data.user!.id)
        .single();
        
      if (profileError) throw profileError;
      
      return {
        user: {
          id: profile.id,
          email: profile.username,
          full_name: profile.full_name,
          role: profile.role,
          position: profile.position,
          deptId: profile.department_id,
          programmeId: profile.programme_id
        } as User,
        token: data.session.access_token
      };
    },
    resetPassword: async (email: string) => {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
    },
    updatePassword: async (password: string) => {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
    },
    logout: async () => {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    },
    getSession: async () => {
      const { data, error } = await supabase.auth.getSession();
      if (error) throw error;
      return data.session;
    }
  },
  departments: {
    list: () => request<Department[]>("/departments/"),
    save: (data: Department) =>
      request<Department>(`/departments/${data.id ? data.id + "/" : ""}`, {
        method: data.id ? "PUT" : "POST",
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      request(`/departments/${id}/`, { method: "DELETE" }),
  },
  programmes: {
    list: () => request<Programme[]>("/programmes/"),
    save: (data: Programme) =>
      request<Programme>(`/programmes/${data.id ? data.id + "/" : ""}`, {
        method: data.id ? "PUT" : "POST",
        body: JSON.stringify(data),
      }),
    delete: (id: string) => request(`/programmes/${id}/`, { method: "DELETE" }),
  },
  sessions: {
    list: () => request<Session[]>("/sessions/"),
    create: (name: string) =>
      request<Session>("/sessions/", {
        method: "POST",
        body: JSON.stringify({ name }),
      }),
    activate: (id: string) =>
      request<Session>(`/sessions/${id}/`, {
        method: "PUT",
        body: JSON.stringify({ id, isActive: true }),
      }),
    delete: (id: string) => request(`/sessions/${id}/`, { method: "DELETE" }),
  },
  courses: {
    list: () => request<Course[]>("/courses/"),
    save: (data: Course) =>
      request<Course>(
        `/courses/${data.id && !data.id.toString().includes("local") ? data.id + "/" : ""}`,
        {
          method:
            data.id && !data.id.toString().includes("local") ? "PUT" : "POST",
          body: JSON.stringify(data),
        },
      ),
    delete: (id: string) => request(`/courses/${id}/`, { method: "DELETE" }),
  },
  questions: {
    list: () => request<Question[]>("/questions/"),
    save: (data: Question) =>
      request<Question>(
        `/questions/${data.id && !data.id.toString().includes("custom") ? data.id + "/" : ""}`,
        {
          method:
            data.id && !data.id.toString().includes("custom") ? "PUT" : "POST",
          body: JSON.stringify(data),
        },
      ),
  },
  papers: {
    list: () => request<AssessmentPaper[]>("/papers/"),
    save: (data: AssessmentPaper) => {
      const isNew = !data.id;
      return request<AssessmentPaper>(`/papers/${isNew ? "" : data.id + "/"}`, {
        method: isNew ? "POST" : "PUT",
        body: JSON.stringify(data),
      });
    },
  },
  templates: {
    list: async () => {
      try {
        const { data, error } = await supabase.from("assessment_templates").select("*");
        if (error) throw error;
        return (data || []).map(t => ({
          ...t,
          sections: typeof t.sections === 'string' ? JSON.parse(t.sections) : t.sections,
          layout: typeof t.layout === 'string' ? JSON.parse(t.layout) : t.layout,
        }));
      } catch (e) {
        console.warn("Failed to fetch templates from Supabase, falling back to localStorage", e);
        const local = localStorage.getItem("polygen_templates");
        return local ? JSON.parse(local) : [];
      }
    },
    save: async (template: AssessmentTemplate) => {
      try {
        const dbData = {
          ...template,
          sections: JSON.stringify(template.sections),
          layout: JSON.stringify(template.layout),
        };
        const { data, error } = await supabase
          .from("assessment_templates")
          .upsert([dbData])
          .select()
          .single();
        if (error) throw error;
        return {
          ...data,
          sections: typeof data.sections === 'string' ? JSON.parse(data.sections) : data.sections,
          layout: typeof data.layout === 'string' ? JSON.parse(data.layout) : data.layout,
        };
      } catch (e) {
        console.warn("Failed to save template to Supabase, falling back to localStorage", e);
        const local = localStorage.getItem("polygen_templates");
        const templates = local ? JSON.parse(local) : [];
        const idx = templates.findIndex((t: AssessmentTemplate) => t.id === template.id);
        if (idx >= 0) {
          templates[idx] = template;
        } else {
          templates.push(template);
        }
        localStorage.setItem("polygen_templates", JSON.stringify(templates));
        return template;
      }
    },
    delete: async (id: string) => {
      try {
        const { error } = await supabase.from("assessment_templates").delete().eq("id", id);
        if (error) throw error;
      } catch (e) {
        console.warn("Failed to delete template from Supabase, falling back to localStorage", e);
        const local = localStorage.getItem("polygen_templates");
        if (local) {
          const templates = JSON.parse(local).filter((t: AssessmentTemplate) => t.id !== id);
          localStorage.setItem("polygen_templates", JSON.stringify(templates));
        }
      }
    }
  },
  users: {
    list: () => request<User[]>("/users/"),
    delete: (id: string) =>
      request(`/users/${id}/`, { method: "DELETE" }),
    updateProfile: (
      id: string,
      data: Partial<User>,
    ) =>
      request<{ user: User }>(`/users/${id}/update`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
  },
  lookup: {
    learningDomains: () =>
      request<LearningDomain[]>("/lookup/learning_domains"),
    taxonomies: () => request<Taxonomy[]>("/lookup/taxonomies"),
    itemTypes: () => request<ItemType[]>("/lookup/item_types"),
    dublinAccords: () => request<DublinAccord[]>("/lookup/dublin_accord_standards"),
    saveDublinAccord: (data: DublinAccord) => {
      const isLocal = data.id && data.id.toString().includes("local");
      const payload: Partial<DublinAccord> = { ...data };
      if (isLocal) delete payload.id;

      return request<DublinAccord>(
        `/lookup/dublin_accord_standards/${!isLocal ? data.id + "/" : ""}`,
        {
          method: !isLocal ? "PUT" : "POST",
          body: JSON.stringify(payload),
        },
      );
    },
    deleteDublinAccord: (id: string) =>
      request(`/lookup/dublin_accord_standards/${id}/`, { method: "DELETE" }),
  },
  storage: {
    uploadLogo: async (file: File): Promise<string> => {
      const fileExt = file.name.split(".").pop();
      const fileName = `logo-${Date.now()}.${fileExt}`;
      
      const { error } = await supabase.storage
        .from("branding")
        .upload(fileName, file, {
          cacheControl: "3600",
          upsert: true,
        });

      if (error) {
        console.warn("Storage upload failed, falling back to base64 encoding:", error);
        
        // Check file size (limit to 2MB for base64 fallback)
        if (file.size > 2 * 1024 * 1024) {
          throw new Error("Storage bucket not found and file is too large for base64 fallback. Please use an image smaller than 2MB or run the setup_storage.sql script in your Supabase dashboard.");
        }

        // Fallback to base64 encoding
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from("branding").getPublicUrl(fileName);

      return publicUrl;
    },
    uploadQuestionImage: async (file: File): Promise<string> => {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/upload/r2", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to upload image to R2");
      }

      const data = await response.json();
      return data.url;
    },
  },
};
